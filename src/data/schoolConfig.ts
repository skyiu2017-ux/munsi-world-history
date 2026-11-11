// 학교·학급 설정: 학급 수가 바뀌면 CLASS_COUNT만 고치면 됩니다.
export const SCHOOL_NAME = '문시중학교';
export const GRADE = 3;
export const CLASS_COUNT = 13;

export const CLASSES_LIST: string[] = Array.from(
  { length: CLASS_COUNT },
  (_, i) => `${GRADE}학년 ${i + 1}반`
);

export const isValidClass = (gradeClass: string): boolean => CLASSES_LIST.includes(gradeClass);

// 학급 랭킹 공용 저장소(Google Sheets + Apps Script) 웹 앱 URL.
// apps-script/Code.gs 를 배포한 뒤 받은 .../exec 주소를 아래 따옴표 안에 붙여넣으세요.
// 비워 두면 랭킹은 각 기기에만 저장됩니다.
export const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxEzHO0H1dQ2NL0mGAGCt6paEd7hSWiUyQX6-wTvlNlcD7pTJJNIpY1kBrs3DM98W63xw/exec';
