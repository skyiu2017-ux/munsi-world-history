/**
 * 문시중 세계사 앱 - 학급 랭킹 저장소 (Google Sheets + Apps Script)
 *
 * 설치: 새 Google 시트 > 확장 프로그램 > Apps Script > 이 코드를 붙여넣기 > 저장
 * 배포: 배포 > 새 배포 > 유형 "웹 앱" > 실행 계정 "나" > 액세스 "모든 사용자" > 배포
 * 연결: 발급된 웹 앱 URL(.../exec)을 앱의 src/data/schoolConfig.ts 안 SHEETS_API_URL에 붙여넣기
 *
 * 기록은 학생(기기) 1명당 한 줄로 저장되며, 다시 플레이하면 같은 줄이 갱신됩니다.
 * 부적절한 닉네임 등은 시트에서 해당 줄을 삭제하면 랭킹에서 사라집니다.
 */

const SHEET_NAME = '랭킹';
const GRADE = 3;
const CLASS_COUNT = 13; // 학급 수가 바뀌면 앱의 schoolConfig.ts와 함께 수정
const HEADERS = [
  'id', '닉네임', '학급', '점수', '정답률', '최대콤보', '칭호',
  '소요시간(초)', '문항당속도(초)', '탈출위치', '탈출률', '플레이횟수', '최근기록'
];

function doGet() {
  try {
    const sh = getSheet_();
    const last = sh.getLastRow();
    const rows = last > 1 ? sh.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
    const entries = rows
      .filter(function (r) { return r[0] !== '' && isValidClass_(String(r[2])); })
      .map(function (r) {
        return {
          id: String(r[0]),
          nickname: String(r[1]),
          gradeClass: String(r[2]),
          score: num_(r[3], 0, 1000000),
          accuracy: num_(r[4], 0, 100),
          maxCombo: num_(r[5], 0, 10000),
          title: String(r[6]),
          timeTakenSeconds: r[7] === '' ? null : num_(r[7], 0, 100000),
          speedPerQuestion: r[8] === '' ? null : num_(r[8], 0, 100000),
          escapeFloor: String(r[9]),
          escapeRate: num_(r[10], 0, 100),
          playCount: num_(r[11], 0, 1000000),
          updatedAt: r[12] instanceof Date ? r[12].toISOString() : String(r[12])
        };
      });
    return json_({ ok: true, entries: entries });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }

  const id = String(body.id || '');
  const gradeClass = String(body.gradeClass || '');
  const nickname = text_(body.nickname, 12);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return json_({ ok: false, error: 'bad id' });
  if (!isValidClass_(gradeClass)) return json_({ ok: false, error: 'bad class' });
  if (!nickname) return json_({ ok: false, error: 'bad nickname' });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    const sh = getSheet_();
    const last = sh.getLastRow();
    let rowIndex = -1;
    let playCount = 0;
    if (last > 1) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === id) {
          rowIndex = i + 2;
          playCount = num_(sh.getRange(rowIndex, 12).getValue(), 0, 1000000);
          break;
        }
      }
    }

    // 프로필(닉네임·학급)만 바꾼 경우: 이미 기록이 있는 줄만 수정하고, 새 줄은 만들지 않음
    const played = body.played === true;
    if (rowIndex === -1 && !played) return json_({ ok: true, skipped: true });

    const row = [
      id,
      nickname,
      gradeClass,
      num_(body.score, 0, 1000000),
      num_(body.accuracy, 0, 100),
      num_(body.maxCombo, 0, 10000),
      text_(body.title, 30),
      body.timeTakenSeconds == null ? '' : num_(body.timeTakenSeconds, 0, 100000),
      body.speedPerQuestion == null ? '' : num_(body.speedPerQuestion, 0, 100000),
      text_(body.escapeFloor, 40),
      num_(body.escapeRate, 0, 100),
      playCount + (played ? 1 : 0),
      new Date()
    ];

    if (rowIndex === -1) {
      sh.appendRow(row);
    } else {
      sh.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    // 닉네임·학급·칭호·탈출위치는 숫자나 날짜로 자동 변환되지 않게 텍스트 서식으로 고정
    sh.getRange('A:C').setNumberFormat('@');
    sh.getRange('G:G').setNumberFormat('@');
    sh.getRange('J:J').setNumberFormat('@');
  }
  return sh;
}

function isValidClass_(gradeClass) {
  const m = /^(\d+)학년 (\d+)반$/.exec(gradeClass);
  return !!m && Number(m[1]) === GRADE && Number(m[2]) >= 1 && Number(m[2]) <= CLASS_COUNT;
}

function num_(value, min, max) {
  const n = Number(value);
  if (!isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

// 글자 수 제한 + 수식으로 해석될 수 있는 첫 글자(= + - @) 제거
function text_(value, maxLen) {
  return String(value == null ? '' : value)
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .replace(/^[=+\-@]+/, '')
    .slice(0, maxLen);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
