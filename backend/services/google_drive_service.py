import os
import io
import logging
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

DEFAULT_FILE_ID = "1ThrEo_B1MmKXFtClvlfCtTLezMEtjyhX"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


class GoogleDriveService:
    def __init__(self, file_id: Optional[str] = None, credentials_path: Optional[str] = None):
        self.file_id = file_id or os.environ.get("GOOGLE_DRIVE_FILE_ID", DEFAULT_FILE_ID)
        self.credentials_path = credentials_path or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        self._service = None

    def _get_service(self):
        if self._service is not None:
            return self._service

        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        import google.auth

        creds = None

        if self.credentials_path and os.path.exists(self.credentials_path):
            logger.info(f"Authenticating Google Drive API using service account file: {self.credentials_path}")
            creds = service_account.Credentials.from_service_account_file(
                self.credentials_path, scopes=SCOPES
            )
        elif self.credentials_path and self.credentials_path.strip().startswith("{"):
            # Credentials provided as JSON string directly in env var
            import json
            logger.info("Authenticating Google Drive API using service account JSON string")
            info = json.loads(self.credentials_path)
            creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
        else:
            logger.info("Attempting default Google application credentials...")
            try:
                creds, _ = google.auth.default(scopes=SCOPES)
            except Exception as e:
                logger.warning(f"Could not load default Google credentials: {e}")
                raise ValueError(
                    "Google Drive service account credentials not found. "
                    "Set GOOGLE_APPLICATION_CREDENTIALS environment variable to a valid JSON file path."
                )

        self._service = build("drive", "v3", credentials=creds, cache_discovery=False)
        return self._service

    def get_file_metadata(self, file_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetch metadata for the Google Drive file (including modifiedTime and name)."""
        fid = file_id or self.file_id
        service = self._get_service()
        try:
            metadata = service.files().get(
                fileId=fid,
                fields="id, name, modifiedTime, md5Checksum, size, mimeType",
                supportsAllDrives=True
            ).execute()
            return metadata
        except Exception as e:
            logger.error(f"Failed to fetch metadata for file_id {fid}: {e}")
            raise

    def download_file_bytes(self, file_id: Optional[str] = None) -> bytes:
        """Download the raw bytes of the file from Google Drive."""
        fid = file_id or self.file_id
        service = self._get_service()
        from googleapiclient.http import MediaIoBaseDownload

        try:
            request = service.files().get_media(fileId=fid, supportsAllDrives=True)
            file_stream = io.BytesIO()
            downloader = MediaIoBaseDownload(file_stream, request)
            
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    logger.debug(f"Download progress: {int(status.progress() * 100)}%")

            file_bytes = file_stream.getvalue()
            logger.info(f"Successfully downloaded {len(file_bytes)} bytes for file {fid}")
            return file_bytes
        except Exception as e:
            logger.error(f"Error downloading file {fid} from Google Drive: {e}")
            raise
