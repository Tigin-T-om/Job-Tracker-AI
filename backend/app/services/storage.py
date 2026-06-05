import os
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.provider = settings.storage_provider
        self.drive_service = None
        
        if self.provider == "google_drive":
            try:
                from google.oauth2 import service_account
                from googleapiclient.discovery import build
                
                credentials_path = "google_drive_credentials.json"
                if not os.path.exists(credentials_path):
                    print("[Storage Service] WARNING: google_drive_credentials.json not found! Falling back to local storage.")
                    self.provider = "local"
                else:
                    credentials = service_account.Credentials.from_service_account_file(
                        credentials_path,
                        scopes=["https://www.googleapis.com/auth/drive"]
                    )
                    self.drive_service = build("drive", "v3", credentials=credentials)
            except Exception as e:
                print(f"[Storage Service] Error configuring Google Drive client: {e}. Falling back to local storage.")
                self.provider = "local"

    def upload_file(self, file_content: bytes, filename: str, sub_dir: str = "uploads/resumes") -> str:
        """
        Uploads a file. Returns either local file path or Google Drive file ID.
        """
        if self.provider == "google_drive" and self.drive_service:
            try:
                from googleapiclient.http import MediaIoBaseUpload
                import io
                
                file_metadata = {'name': filename}
                if settings.google_drive_folder_id:
                    file_metadata['parents'] = [settings.google_drive_folder_id]
                
                media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype='application/pdf', resumable=True)
                file = self.drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
                # Prefixing with google_drive: allows the system to identify how to retrieve this file
                return f"google_drive:{file.get('id')}"
            except Exception as e:
                print(f"[Storage Service] Google Drive upload failed: {e}. Falling back to local.")
                return self._save_locally(file_content, filename, sub_dir)
        else:
            return self._save_locally(file_content, filename, sub_dir)

    def _save_locally(self, file_content: bytes, filename: str, sub_dir: str) -> str:
        os.makedirs(sub_dir, exist_ok=True)
        import time
        file_ext = os.path.splitext(filename)[1]
        unique_name = f"upload_{int(time.time())}_{filename}"
        file_path = os.path.join(sub_dir, unique_name)
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        return file_path

    def download_file(self, path_or_id: str) -> bytes:
        """
        Downloads / reads file bytes based on path or ID.
        """
        if path_or_id.startswith("google_drive:") and self.drive_service:
            try:
                from googleapiclient.http import MediaIoBaseDownload
                import io
                
                file_id = path_or_id.split("google_drive:")[1]
                request = self.drive_service.files().get_media(fileId=file_id)
                fh = io.BytesIO()
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while not done:
                    _, done = downloader.next_chunk()
                fh.seek(0)
                return fh.read()
            except Exception as e:
                raise IOError(f"Failed to download file from Google Drive: {e}")
        else:
            local_path = path_or_id
            if not os.path.exists(local_path):
                raise FileNotFoundError(f"Local file not found at: {local_path}")
            with open(local_path, "rb") as f:
                return f.read()

    def delete_file(self, path_or_id: str) -> None:
        """
        Deletes the file from local disk or Google Drive.
        """
        if path_or_id.startswith("google_drive:") and self.drive_service:
            try:
                file_id = path_or_id.split("google_drive:")[1]
                self.drive_service.files().delete(fileId=file_id).execute()
            except Exception as e:
                print(f"[Storage Service] Failed to delete file from Google Drive: {e}")
        else:
            try:
                if os.path.exists(path_or_id):
                    os.remove(path_or_id)
            except Exception as e:
                print(f"[Storage Service] Failed to delete local file: {e}")

storage_service = StorageService()
