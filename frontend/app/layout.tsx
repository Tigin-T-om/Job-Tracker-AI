// ---------------------------------------------------------------------------
// layout.tsx - Root layout for the entire application
// Configures global fonts (Bricolage Grotesque), metadata (SEO), and mounts
// the global ToastContainer so notifications work on every page.
// ---------------------------------------------------------------------------
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/Toast";

// Configure Bricolage Grotesque (include weights from 300 to 800)
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobTracker.AI",
  description: "AI-powered job tracker portfolio application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${geistMono.variable} h-full antialiased`} // <-- Change variable here
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
