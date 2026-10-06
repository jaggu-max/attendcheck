import io
import pytest
import openpyxl
from services.xlsx_parser import parse_xlsx_bytes


def create_sample_workbook_bytes() -> bytes:
    """Helper to generate a realistic GMIT Attendance Excel workbook in memory."""
    wb = openpyxl.Workbook()
    
    # Sheet 1: 5A
    ws_5a = wb.active
    ws_5a.title = "5A"

    rows_5a = [
        ["GMIT DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", None, None, None, None, None, None],
        ["Course Code:", None, None, "BCS501", "BCS502", "BCS503", "BCSL504"],
        ["Teacher Name:", None, None, "SHALINI M R", "NANDITHA G", "HARSHITHA H V", "SHALINI M R"],
        ["Class Taken:", None, None, 13, 12, 17, 3],
        ["SL NO", "USN", "STUDENT NAME", "SEPM", "CN", "TOC", "WL"],
        [1, "4GM24CS036", "JAGADEESH SHIVAYOGI BENTOOR", 7, 10, 15, 3],
        [2, "4GM24CS037", "ANANYA S", 13, 12, 17, 3],
        [3, "4GM24CS038", "RAHUL K", 2, 4, 5, 0],
    ]
    for r in rows_5a:
        ws_5a.append(r)

    # Sheet 2: 3B
    ws_3b = wb.create_sheet(title="3B")
    rows_3b = [
        ["Course Code:", None, "21CS31", "21CS32"],
        ["Teacher Name:", None, "PROF. DATA", "DR. ALGO"],
        ["Class Taken:", None, 20, 20],
        ["USN", "STUDENT NAME", "DS", "ALGO"],
        ["4GM23CS001", "PRIYA M", 15, 18],
    ]
    for r in rows_3b:
        ws_3b.append(r)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def test_parse_xlsx_bytes_sections_and_students():
    xlsx_bytes = create_sample_workbook_bytes()
    result = parse_xlsx_bytes(xlsx_bytes)

    assert "5A" in result["sections"]
    assert "3B" in result["sections"]
    
    students_by_usn = result["students_by_usn"]
    assert "4GM24CS036" in students_by_usn
    
    jaga = students_by_usn["4GM24CS036"]
    assert jaga["usn"] == "4GM24CS036"
    assert jaga["name"] == "JAGADEESH SHIVAYOGI BENTOOR"
    assert jaga["section"] == "5A"
    
    # Check subjects
    subjects = jaga["subjects"]
    assert len(subjects) == 4
    
    sepm = next(s for s in subjects if s["courseCode"] == "BCS501")
    assert sepm["attended"] == 7
    assert sepm["conducted"] == 13
    assert sepm["percentage"] == 53.85
    assert sepm["status"] == "SHORTAGE"
    assert sepm["recovery"]["needed"] > 0

    wl = next(s for s in subjects if s["courseCode"] == "BCSL504")
    assert wl["attended"] == 3
    assert wl["conducted"] == 3
    assert wl["percentage"] == 100.0
    assert wl["status"] == "EXCELLENT"


def test_perfect_attendance_student():
    xlsx_bytes = create_sample_workbook_bytes()
    result = parse_xlsx_bytes(xlsx_bytes)
    
    ananya = result["students_by_usn"]["4GM24CS037"]
    assert ananya["overall"]["percentage"] == 100.0
    assert ananya["overall"]["status"] == "EXCELLENT"


def test_missing_student_lookup():
    xlsx_bytes = create_sample_workbook_bytes()
    result = parse_xlsx_bytes(xlsx_bytes)
    
    assert "4GM99CS999" not in result["students_by_usn"]
