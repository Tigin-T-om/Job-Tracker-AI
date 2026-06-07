# ---------------------------------------------------------------------------
# storage.py - File storage abstraction layer
# Provides a unified API for uploading, downloading, and deleting files.
# Supports two providers:
#   1. google_drive - stores files in the user's personal Google Drive
#   2. local        - stores files on the server's local filesystem
# Falls back to local storage if Google Drive credentials are missing.
# ---------------------------------------------------------------------------
import os
from app.core.config import settings

class StorageService:
    """Unified file storage service with pluggable provider support."""

    def __init__(self):
        self.provider = settings.storage_provider  # "google_drive" or "local"
    def _get_drive_service(self, user_id: int):
        """Load saved OAuth credentials for a user and build a Drive API client.
        Returns None if no credentials exist or they cannot be loaded."""
        """
        Loads the user-specific credentials file.
        """
        token_path = f"google_drive_token_user_{user_id}.json"
        if not os.path.exists(token_path):
            return None
        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            from googleapiclient.discovery import build
            creds = Credentials.from_authorized_user_file(
                token_path, 
                scopes=["https://www.googleapis.com/auth/drive.file"]
            )
            # Refresh token for this specific user
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                with open(token_path, "w") as f:
                    f.write(creds.to_json())
            return build("drive", "v3", credentials=creds)
        except Exception as e:
            print(f"[Storage Service] Error loading Google OAuth credentials for user {user_id}: {e}")
            return None

    def _get_or_create_folder(self, service) -> str:
        """Find or create a 'JobTrackerAI' folder in the user's Drive root.
        All uploaded files are stored inside this folder for organisation."""
        try:
            query = "mimeType = 'application/vnd.google-apps.folder' and name = 'JobTrackerAI' and trashed = false"
            results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
            files = results.get('files', [])
            if files:
                return files[0]['id']
            folder_metadata = {
                'name': 'JobTrackerAI',
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = service.files().create(body=folder_metadata, fields='id').execute()
            return folder.get('id')
        except Exception as e:
            print(f"[Storage Service] Error creating folder: {e}")
            return ""

    def upload_file(self, file_content: bytes, filename: str, user_id: int, sub_dir: str = "uploads/resumes") -> str:
        """Upload a file to the configured storage provider.
        Returns a path string: 'google_drive:<fileId>' or a local filesystem path."""
        service = self._get_drive_service(user_id)
        if self.provider == "google_drive" and service:
            try:
                from googleapiclient.http import MediaIoBaseUpload
                import io
                folder_id = self._get_or_create_folder(service)
                file_metadata = {'name': filename}
                if folder_id:
                    file_metadata['parents'] = [folder_id]
                media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype='application/pdf', resumable=True)
                file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
                
                return f"google_drive:{file.get('id')}"
            except Exception as e:
                print(f"[Storage Service] Upload failed for user {user_id}: {e}. Falling back to local.")
                return self._save_locally(file_content, filename, sub_dir)
        else:
            return self._save_locally(file_content, filename, sub_dir)

    def _save_locally(self, file_content: bytes, filename: str, sub_dir: str) -> str:
        """Save a file to the local filesystem with a unique timestamped name."""
        os.makedirs(sub_dir, exist_ok=True)
        import time
        file_ext = os.path.splitext(filename)[1]
        unique_name = f"upload_{int(time.time())}_{filename}"
        file_path = os.path.join(sub_dir, unique_name)
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        return file_path

    def download_file(self, path_or_id: str, user_id: int) -> bytes:
        """Download a file's raw bytes from Google Drive or local disk."""
        service = self._get_drive_service(user_id)
        if path_or_id.startswith("google_drive:") and service:
            try:
                from googleapiclient.http import MediaIoBaseDownload
                import io
                file_id = path_or_id.split("google_drive:")[1]
                request = service.files().get_media(fileId=file_id)
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

    def delete_file(self, path_or_id: str, user_id: int) -> None:
        """Permanently delete a file from Google Drive or local disk."""
        service = self._get_drive_service(user_id)
        if path_or_id.startswith("google_drive:") and service:
            try:
                file_id = path_or_id.split("google_drive:")[1]
                service.files().delete(fileId=file_id).execute()
            except Exception as e:
                print(f"[Storage Service] Failed to delete file from Google Drive: {e}")
        else:
            try:
                if os.path.exists(path_or_id):
                    os.remove(path_or_id)
            except Exception as e:
                print(f"[Storage Service] Failed to delete local file: {e}")


# Singleton instance used throughout the application
storage_service = StorageService()
