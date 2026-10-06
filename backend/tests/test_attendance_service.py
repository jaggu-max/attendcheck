import pytest
from unittest.mock import MagicMock
from services.attendance_cache import AttendanceCacheManager
from tests.test_xlsx_parser import create_sample_workbook_bytes


def test_cache_manager_download_and_sync_status():
    mock_drive = MagicMock()
    mock_drive.file_id = "test_file_id_123"
    mock_drive.get_file_metadata.return_value = {
        "id": "test_file_id_123",
        "modifiedTime": "2026-10-06T12:00:00Z"
    }
    mock_drive.download_file_bytes.return_value = create_sample_workbook_bytes()

    cache_mgr = AttendanceCacheManager(drive_service=mock_drive)
    
    # First fetch: should download file
    student = cache_mgr.get_student("4GM24CS036")
    assert student is not None
    assert student["name"] == "JAGADEESH SHIVAYOGI BENTOOR"
    assert mock_drive.download_file_bytes.call_count == 1

    # Second fetch with unchanged modifiedTime: should reuse cache without downloading again
    student_cached = cache_mgr.get_student("4GM24CS036")
    assert student_cached is not None
    assert mock_drive.download_file_bytes.call_count == 1 # Still 1! File change detection worked!

    # Check sync status
    status = cache_mgr.get_sync_status()
    assert status["status"] == "healthy"
    assert status["file_id"] == "test_file_id_123"
    assert status["students_loaded"] == 4
    assert set(status["sections"]) == {"5A", "3B"}


def test_cache_manager_stale_cache_fallback_on_drive_error():
    mock_drive = MagicMock()
    mock_drive.file_id = "test_file_id_123"
    mock_drive.get_file_metadata.return_value = {"modifiedTime": "2026-10-06T12:00:00Z"}
    mock_drive.download_file_bytes.return_value = create_sample_workbook_bytes()

    cache_mgr = AttendanceCacheManager(drive_service=mock_drive)
    cache_mgr.get_student("4GM24CS036") # Warm up cache

    # Simulate Drive error on forced refresh
    mock_drive.get_file_metadata.side_effect = Exception("Google API Network Timeout")
    
    # Should serve stale cache instead of failing completely
    student = cache_mgr.get_student("4GM24CS036", force=True)
    assert student is not None
    assert cache_mgr.status == "degraded"
