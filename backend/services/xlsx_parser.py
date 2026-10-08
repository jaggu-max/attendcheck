import io
import re
import logging
from typing import Dict, Any, List, Optional
import openpyxl

logger = logging.getLogger(__name__)

USN_REGEX = re.compile(r"^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$", re.IGNORECASE)
COURSE_CODE_REGEX = re.compile(r"^[A-Z]{3,4}[0-9]{3}[A-Z0-9]*$", re.IGNORECASE)


def parse_xlsx_bytes(file_bytes: bytes) -> Dict[str, Any]:
    """
    Parse GMIT Attendance Excel Workbook bytes.
    Extracts student records, subjects, conducted counts, and calculates percentages across all section worksheets.
    """
    wb = openpyxl.load_workbook(filename=io.BytesIO(file_bytes), data_only=True, read_only=True)
    
    sections = []
    students_by_usn: Dict[str, Dict[str, Any]] = {}
    students_by_section: Dict[str, List[Dict[str, Any]]] = {}

    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        clean_section = sheet_name.strip().toUpperCase() if hasattr(sheet_name.strip(), "toUpperCase") else sheet_name.strip().upper()
        
        # Skip hidden or summary sheets if any non-section sheets exist
        if len(clean_section) > 5 and not re.match(r"^[0-9][A-Z]{1,2}$", clean_section):
            # If sheet name is not standard like 3A, 5B, 7A, check if it contains section pattern
            m = re.search(r"\b([0-9][A-Z])\b", clean_section)
            if m:
                clean_section = m.group(1)

        parsed_students = parse_worksheet(sheet, clean_section)
        if parsed_students:
            sections.append(clean_section)
            students_by_section[clean_section] = parsed_students
            for student in parsed_students:
                usn = student["usn"]
                students_by_usn[usn] = student

    logger.info(f"Parsed XLSX workbook: found {len(sections)} sections ({', '.join(sections)}) and {len(students_by_usn)} total students.")
    return {
        "sections": sections,
        "students_by_usn": students_by_usn,
        "students_by_section": students_by_section,
    }


def parse_worksheet(sheet: openpyxl.worksheet.worksheet.Worksheet, section: str) -> List[Dict[str, Any]]:
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    # Find the header row containing USN
    usn_row_idx = None
    usn_col_idx = None
    name_col_idx = None

    for r_idx, row in enumerate(rows[:25]): # Search top 25 rows
        for c_idx, val in enumerate(row):
            if val is not None and isinstance(val, str):
                cell_str = val.strip().upper()
                if cell_str in ["USN", "USN NO", "USN NUMBER", "STUDENT USN"]:
                    usn_row_idx = r_idx
                    usn_col_idx = c_idx
                    break
        if usn_row_idx is not None:
            break

    # If USN header text not explicitly found, scan for row containing actual USN pattern values
    if usn_row_idx is None:
        for r_idx, row in enumerate(rows):
            for c_idx, val in enumerate(row):
                if val is not None and isinstance(val, str) and USN_REGEX.match(val.strip()):
                    usn_row_idx = max(0, r_idx - 1)
                    usn_col_idx = c_idx
                    break
            if usn_row_idx is not None:
                break

    if usn_row_idx is None or usn_col_idx is None:
        logger.warning(f"Could not find USN header/column in sheet {section}")
        return []

    # Find Name column (usually adjacent to USN)
    usn_header_row = rows[usn_row_idx]
    for c_idx, val in enumerate(usn_header_row):
        if c_idx != usn_col_idx and val is not None and isinstance(val, str):
            cell_str = val.strip().upper()
            if "NAME" in cell_str or "STUDENT" in cell_str:
                name_col_idx = c_idx
                break
    if name_col_idx is None:
        name_col_idx = usn_col_idx + 1

    # Extract subject column definitions from rows above USN header
    # Rows above usn_row_idx can contain: Course Code, Teacher Name, Class Taken / Conducted
    subject_cols = []
    
    course_code_row = None
    teacher_row = None
    conducted_row = None

    # Inspect rows above USN row
    for r_idx in range(usn_row_idx):
        row = rows[r_idx]
        row_str = " ".join([str(v) for v in row if v is not None]).upper()
        
        if "TEACHER" in row_str or "FACULTY" in row_str or "LECTURER" in row_str:
            teacher_row = row
        elif "CLASS TAKEN" in row_str or "CLASSES CONDUCTED" in row_str or "CONDUCTED" in row_str or "CLASSES TAKEN" in row_str or "TOTAL CLASSES" in row_str:
            conducted_row = row
        elif any(isinstance(v, str) and COURSE_CODE_REGEX.match(v.strip()) for v in row if v is not None):
            course_code_row = row

    # If explicit rows weren't labeled, inspect by content heuristics
    if course_code_row is None and usn_row_idx > 0:
        for r_idx in range(usn_row_idx):
            row = rows[r_idx]
            match_count = sum(1 for v in row if v is not None and isinstance(v, str) and (COURSE_CODE_REGEX.match(v.strip()) or len(v.strip()) in [5, 6, 7, 8]))
            if match_count >= 2:
                course_code_row = row
                break

    if conducted_row is None and usn_row_idx > 0:
        for r_idx in range(usn_row_idx):
            row = rows[r_idx]
            # Conducted row has numeric values in subject columns
            num_count = sum(1 for v in row if v is not None and isinstance(v, (int, float)) and 1 <= v <= 200)
            if num_count >= 2 and row != course_code_row:
                conducted_row = row
                break

    if teacher_row is None and usn_row_idx > 0:
        for r_idx in range(usn_row_idx):
            row = rows[r_idx]
            if row != course_code_row and row != conducted_row:
                str_count = sum(1 for v in row if v is not None and isinstance(v, str) and re.search(r"[A-Za-z]{2,}", v.strip()) and not COURSE_CODE_REGEX.match(v.strip()))
                if str_count >= 2:
                    teacher_row = row
                    break

    # Determine subject columns (columns after USN & Name columns)
    start_col = max(usn_col_idx, name_col_idx) + 1
    
    for c_idx in range(start_col, len(rows[usn_row_idx])):
        col_header = rows[usn_row_idx][c_idx]
        c_code_val = course_code_row[c_idx] if course_code_row and c_idx < len(course_code_row) else None
        teacher_val = teacher_row[c_idx] if teacher_row and c_idx < len(teacher_row) else None
        conducted_val = conducted_row[c_idx] if conducted_row and c_idx < len(conducted_row) else None

        # Fallback to search any header row for teacher name if not found
        if not teacher_val or not isinstance(teacher_val, str) or not teacher_val.strip():
            for r_idx in range(usn_row_idx):
                r_candidate = rows[r_idx]
                if r_candidate != course_code_row and r_candidate != conducted_row and c_idx < len(r_candidate):
                    val_c = r_candidate[c_idx]
                    if val_c is not None and isinstance(val_c, str) and re.search(r"[A-Za-z]{2,}", val_c.strip()) and not COURSE_CODE_REGEX.match(val_c.strip()):
                        teacher_val = val_c.strip()
                        break

        # Determine course_code / subject name
        course_code = None
        subject_name = None

        if c_code_val and isinstance(c_code_val, str) and c_code_val.strip():
            course_code = c_code_val.strip().upper()
        elif col_header and isinstance(col_header, str) and col_header.strip():
            header_clean = col_header.strip().upper()
            if header_clean not in ["TOTAL", "PERCENTAGE", "%", "STATUS", "SL NO", "S.NO", "SERIAL"]:
                course_code = header_clean

        if not course_code:
            continue

        # If col_header contains subject short name (e.g. SEPM, CN, TOC)
        if col_header and isinstance(col_header, str) and col_header.strip() != course_code:
            subject_name = col_header.strip()
        else:
            subject_name = course_code

        # Parse classes conducted count
        conducted_count = 0
        if conducted_val is not None:
            try:
                conducted_count = int(float(conducted_val))
            except (ValueError, TypeError):
                conducted_count = 0

        # Teacher name cleanup
        teacher_name = str(teacher_val).strip() if teacher_val else "Faculty"

        subject_cols.append({
            "col_idx": c_idx,
            "course_code": course_code,
            "subject_name": subject_name,
            "teacher": teacher_name,
            "conducted": conducted_count,
        })

    # If conducted count for subjects is 0 in header row, attempt to infer max attended in data rows
    for s_info in subject_cols:
        if s_info["conducted"] == 0:
            max_att = 0
            for r_idx in range(usn_row_idx + 1, len(rows)):
                val = rows[r_idx][s_info["col_idx"]] if s_info["col_idx"] < len(rows[r_idx]) else None
                if val is not None:
                    try:
                        att = int(float(val))
                        if att > max_att:
                            max_att = att
                    except (ValueError, TypeError):
                        pass
            s_info["conducted"] = max_att  # If 0, stays 0 (Not Started)

    # Extract student records
    students = []
    for r_idx in range(usn_row_idx + 1, len(rows)):
        row = rows[r_idx]
        if not row or len(row) <= usn_col_idx:
            continue

        raw_usn = row[usn_col_idx]
        if raw_usn is None or not isinstance(raw_usn, str):
            continue

        clean_usn = raw_usn.strip().upper()
        if not USN_REGEX.match(clean_usn):
            continue

        raw_name = row[name_col_idx] if name_col_idx < len(row) else None
        student_name = str(raw_name).strip() if raw_name else "Student"

        subjects_list = []
        tot_attended = 0
        tot_conducted = 0

        for s_info in subject_cols:
            c_idx = s_info["col_idx"]
            val = row[c_idx] if c_idx < len(row) else None
            
            attended = 0
            if val is not None:
                try:
                    attended = int(float(val))
                except (ValueError, TypeError):
                    attended = 0

            conducted = s_info["conducted"]
            teacher_clean = (s_info["teacher"] or "").strip()
            course_clean = (s_info["course_code"] or "").strip()

            # Active subject condition: course_code present & conducted > 0
            is_active = bool(course_clean) and conducted > 0
            is_started = is_active

            if is_started:
                percentage = round((attended / conducted) * 100, 2) if conducted > 0 else 0.0
                if percentage >= 85:
                    status = "EXCELLENT"
                elif percentage >= 75:
                    status = "ON_TRACK"
                else:
                    status = "SHORTAGE"

                can_miss = max(0, int((attended - 0.75 * conducted) / 0.75)) if percentage >= 75 else 0
                recovery_needed = max(1, int(((0.75 * conducted) - attended) / (1 - 0.75) + 0.999)) if percentage < 75 else 0
                buffer_msg = f"You can miss {can_miss} upcoming classes." if can_miss > 0 else ("On track." if percentage >= 75 else "Shortage of attendance.")
                rec_msg = f"Need {recovery_needed} more classes." if recovery_needed > 0 else "On track."
            else:
                percentage = None
                status = "NOT_STARTED"
                can_miss = 0
                recovery_needed = 0
                buffer_msg = "Not started yet."
                rec_msg = "Not started yet."

            teacher_display = teacher_clean if (teacher_clean and teacher_clean.lower() not in ["faculty", "faculty to be assigned"]) else "Faculty to be assigned"

            subj_obj = {
                "courseCode": course_clean,
                "course_code": course_clean,
                "subject": s_info["subject_name"],
                "teacher": teacher_display,
                "attended": attended if is_started else 0,
                "conducted": conducted if is_started else 0,
                "percentage": percentage,
                "status": status,
                "isStarted": is_started,
                "buffer": {"canMiss": can_miss, "message": buffer_msg},
                "recovery": {"needed": recovery_needed, "message": rec_msg},
            }

            subjects_list.append(subj_obj)
            if is_started:
                tot_attended += attended
                tot_conducted += conducted

        overall_pct = round((tot_attended / tot_conducted) * 100, 2) if tot_conducted > 0 else None
        if tot_conducted == 0:
            overall_status = "NOT_STARTED"
            is_overall_started = False
        elif overall_pct >= 85:
            overall_status = "EXCELLENT"
            is_overall_started = True
        elif overall_pct >= 75:
            overall_status = "ON_TRACK"
            is_overall_started = True
        else:
            overall_status = "SHORTAGE"
            is_overall_started = True

        student_record = {
            "usn": clean_usn,
            "name": student_name,
            "section": section,
            "subjects": subjects_list,
            "overall": {
                "attended": tot_attended,
                "conducted": tot_conducted,
                "percentage": overall_pct,
                "status": overall_status,
                "isStarted": is_overall_started,
                "minimumRequired": 75,
            },
            "minimumRequired": 75,
            "success": True,
        }
        students.append(student_record)

    return students
