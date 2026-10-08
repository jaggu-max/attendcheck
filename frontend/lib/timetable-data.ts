export interface ClassSlot {
  id: string;
  name: string;
  type: "Lecture" | "Practical" | "Project" | "Activity" | "Break" | "Empty";
  room?: string;
  faculty?: string;
  code?: string;
  colSpan?: number;
}

export const TIME_SLOTS = [
  { id: "HR1", label: "8:00 - 8:50 AM", start: "08:00", end: "08:50" },
  { id: "HR2", label: "8:50 - 9:40 AM", start: "08:50", end: "09:40" },
  { id: "B1", label: "9:40 - 10:10 AM", start: "09:40", end: "10:10", isBreak: true, name: "Break" },
  { id: "HR3", label: "10:10 - 11:00 AM", start: "10:10", end: "11:00" },
  { id: "HR4", label: "11:00 - 11:50 AM", start: "11:00", end: "11:50" },
  { id: "HR5", label: "11:50 AM - 12:40 PM", start: "11:50", end: "12:40" },
  { id: "B2", label: "12:40 - 1:40 PM", start: "12:40", end: "13:40", isBreak: true, name: "Lunch" },
  { id: "HR6", label: "1:40 - 2:30 PM", start: "13:40", end: "14:30" },
  { id: "HR7", label: "2:30 - 3:20 PM", start: "14:30", end: "15:20" },
  { id: "HR8", label: "3:20 - 4:10 PM", start: "15:20", end: "16:10" },
];

const SUBJECTS = {
  SEPM: { name: "SEPM (L)", code: "BCS501", faculty: "Shalini M R", type: "Lecture", room: "C-132" },
  CN_L: { name: "CN (L)", code: "BCS502", faculty: "Nanditha G", type: "Lecture", room: "C-132" },
  CN_P: { name: "CN (P)", code: "BCS502", faculty: "Nanditha G", type: "Practical", room: "C-132", colSpan: 2 },
  TOC: { name: "TOC (L)", code: "BCS503", faculty: "Harshitha H V", type: "Lecture", room: "C-132" },
  WL: { name: "WL B1/ADA(134) - WL B2/MC(136)", code: "BCSL504", faculty: "Shalini M R", type: "Practical", colSpan: 2 },
  EVS: { name: "EVS (L)", code: "BCS508", faculty: "Eva Meghana", type: "Lecture", room: "C-132" },
  AI: { name: "AI (L)", code: "BCS515A", faculty: "Sushma P M", type: "Lecture", room: "C-132" },
  PROJECT: { name: "PROJECT (Review)", code: "BCS586", faculty: "Harshitha H V", type: "Project", room: "C-132", colSpan: 2 },
  RM: { name: "RM (L)", code: "BRMK557", faculty: "Dr. Vismitha S Patil", type: "Lecture", room: "C-132" },
  EMPTY: { name: "-", type: "Empty" },
} as const;

export const TIMETABLE_5A = [
  {
    day: "Mon",
    dayIndex: 1, // JS getDay() Mon=1
    slots: [
      { id: "1-1", ...SUBJECTS.AI },
      { id: "1-2", ...SUBJECTS.SEPM },
      { id: "1-3", ...SUBJECTS.PROJECT },
      { id: "1-5", ...SUBJECTS.CN_L },
      { id: "1-6", ...SUBJECTS.TOC },
      { id: "1-7", name: "Mentor/GMU Tutor/Lakshya/AI Tutor", type: "Activity", room: "Seminar Hall", colSpan: 2 },
    ],
  },
  {
    day: "Tue",
    dayIndex: 2,
    slots: [
      { id: "2-1", ...SUBJECTS.AI },
      { id: "2-2", ...SUBJECTS.CN_L },
      { id: "2-3", ...SUBJECTS.RM },
      { id: "2-4", ...SUBJECTS.CN_P },
      { id: "2-6", ...SUBJECTS.TOC },
      { id: "2-7", ...SUBJECTS.EMPTY },
      { id: "2-8", ...SUBJECTS.EMPTY },
    ],
  },
  {
    day: "Wed",
    dayIndex: 3,
    slots: [
      { id: "3-1", ...SUBJECTS.SEPM },
      { id: "3-2", ...SUBJECTS.RM },
      { id: "3-3", ...SUBJECTS.AI },
      { id: "3-4", ...SUBJECTS.TOC },
      { id: "3-5", ...SUBJECTS.EMPTY },
      { id: "3-6", name: "Meet The Mentor", type: "Activity", room: "C-132" },
      { id: "3-7", ...SUBJECTS.EMPTY },
      { id: "3-8", ...SUBJECTS.EMPTY },
    ],
  },
  {
    day: "Thu",
    dayIndex: 4,
    slots: [
      { id: "4-1", ...SUBJECTS.CN_L },
      { id: "4-2", ...SUBJECTS.AI },
      { id: "4-3", ...SUBJECTS.RM },
      { id: "4-4", ...SUBJECTS.SEPM },
      { id: "4-5", ...SUBJECTS.EMPTY },
      { id: "4-6", ...SUBJECTS.EMPTY },
      { id: "4-7", name: "ACM Student Chapter Activities", type: "Activity", room: "Seminar Hall", colSpan: 2 },
    ],
  },
  {
    day: "Fri",
    dayIndex: 5,
    slots: [
      { id: "5-1", ...SUBJECTS.SEPM },
      { id: "5-2", ...SUBJECTS.CN_L },
      { id: "5-3", ...SUBJECTS.WL },
      { id: "5-5", ...SUBJECTS.TOC },
      { id: "5-6", ...SUBJECTS.EVS },
      { id: "5-7", ...SUBJECTS.EMPTY },
      { id: "5-8", ...SUBJECTS.EMPTY },
    ],
  },
  {
    day: "Sat",
    dayIndex: 6,
    slots: [
      { id: "6-1", ...SUBJECTS.EMPTY },
      { id: "6-2", ...SUBJECTS.EMPTY },
      { id: "6-3", ...SUBJECTS.EMPTY },
      { id: "6-4", ...SUBJECTS.EMPTY },
      { id: "6-5", ...SUBJECTS.EMPTY },
      { id: "6-6", ...SUBJECTS.EMPTY },
      { id: "6-7", ...SUBJECTS.EMPTY },
      { id: "6-8", ...SUBJECTS.EMPTY },
    ],
  },
];
