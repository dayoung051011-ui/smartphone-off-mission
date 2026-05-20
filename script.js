// =============================================
//  📱 스마트폰 오프(OFF) 미션 앱 - JavaScript
// =============================================
//  이 파일이 하는 일:
//  1. 미션 목록 데이터 보관
//  2. [미션 뽑기] 버튼 → 랜덤 미션 표시
//  3. [미션 완료] 버튼 → 완료 횟수 카운트업 + 포인트/레벨 업데이트
//  4. 최근 완료 기록 저장·표시·삭제 (localStorage 사용)
//  5. 포인트 & 레벨 시스템
// =============================================


// ─────────────────────────────────────────────
//  1. 미션 데이터
// ─────────────────────────────────────────────
const missions = [
  "폰 뒤집어두고 20초 동안 창밖 보기 🪟",
  "폰 가방에 넣고 눈 감고 숨 쉬기 🧘",
  "폰 내려놓고 어깨 힘 빼고 자세 리셋하기 🧘‍♂️",
  "손가락이랑 손목 스트레칭 쭉쭉 하기 🖐️",
  "책상 위 폰 멀리 밀어두고 1분간 시선 떼기 🚫",
  "자리에서 일어나서 물 한 모금 마시고 오기 🥛",
  "주변에 있는 책 아무 페이지나 한 문장 읽기 📖",
  "고개 들고 목 천천히 좌우로 돌리기 🔄",
  "폰 대신 필통에서 펜 꺼내서 낙서 한 줄 하기 ✍️",
  "허리 곧게 펴고 등받이에 붙여 앉기 🪑",
  "창문 너머 하늘 색깔 슬쩍 확인하기 ☁️",
  "스마트폰 화면 닦이로 액정 깨끗하게 닦아두기 ✨",
  "내 방이나 책상 위 물건 딱 3개만 정리하기 🧹",
  "옆 친구나 가족에게 뜬금없이 한 번 웃어주기 😊",
  "타이머 켜고 5분 동안 현실 세계 집중하기 ⏱️",
];


// ─────────────────────────────────────────────
//  2. 레벨 시스템 데이터
//  각 레벨의 이름, 아이콘, 그 레벨에 도달하는 최소 포인트 정의
//  미션 1회 완료 = +10 포인트
// ─────────────────────────────────────────────
const POINTS_PER_MISSION = 10; // 미션 1회 완료 시 획득 포인트

const LEVELS = [
  // { minPts: 이 레벨 최소 포인트, name: 레벨 이름, icon: 이모지 }
  { minPts: 0,   name: '씨앗',  icon: '🌱' }, // Lv.1  0~29 pts
  { minPts: 30,  name: '새싹',  icon: '🌿' }, // Lv.2  30~69 pts
  { minPts: 70,  name: '나무',  icon: '🌳' }, // Lv.3  70~129 pts
  { minPts: 130, name: '별',    icon: '⭐' }, // Lv.4  130~199 pts
  { minPts: 200, name: '왕관',  icon: '👑' }, // Lv.5  200+ pts (최고)
];


// ─────────────────────────────────────────────
//  3. localStorage 키 상수
// ─────────────────────────────────────────────
const STORAGE_KEY_HISTORY = 'missionHistory'; // 완료 기록 배열
const STORAGE_KEY_COUNT   = 'missionCount';   // 총 완료 횟수
const STORAGE_KEY_POINTS  = 'missionPoints';  // 총 포인트


// ─────────────────────────────────────────────
//  4. 상태 변수
// ─────────────────────────────────────────────
let completionCount  = 0;
let totalPoints      = 0;
let missionDrawn     = false;
let lastMissionIndex = -1;
let currentMissionText = '';


// ─────────────────────────────────────────────
//  5. HTML 요소 가져오기
// ─────────────────────────────────────────────
const missionTextEl    = document.getElementById('missionText');
const missionCardEl    = document.getElementById('missionCard');
const countEl          = document.getElementById('count');
const completeBtnEl    = document.getElementById('completeBtn');
const congratsEl       = document.getElementById('congratsMessage');
const cardHintEl       = document.getElementById('cardHint');
const historyListEl    = document.getElementById('historyList');
const historyEmptyEl   = document.getElementById('historyEmpty');
const clearBtnEl       = document.getElementById('clearBtn');

// 레벨 카드 요소들
const levelIconEl      = document.getElementById('levelIcon');
const levelNumEl       = document.getElementById('levelNum');
const levelNameEl      = document.getElementById('levelName');
const levelPointsEl    = document.getElementById('levelPoints');
const levelBarFillEl   = document.getElementById('levelBarFill');
const levelNextEl      = document.getElementById('levelNext');

// 레벨업 토스트 요소들
const levelupToastEl   = document.getElementById('levelupToast');
const levelupIconEl    = document.getElementById('levelupIcon');
const levelupTitleEl   = document.getElementById('levelupTitle');
const levelupSubEl     = document.getElementById('levelupSub');


// ─────────────────────────────────────────────
//  6. 레벨 계산 헬퍼 함수들
// ─────────────────────────────────────────────

/**
 * getLevelIndex(points) — 현재 포인트로 몇 번째 레벨인지 반환한다 (0부터 시작).
 * @param {number} points
 * @returns {number} 0~4 사이의 레벨 인덱스
 */
function getLevelIndex(points) {
  // LEVELS 배열을 뒤에서부터 순회하며 현재 포인트가 minPts 이상인 첫 번째 레벨을 찾음
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPts) return i;
  }
  return 0;
}

/**
 * getLevelProgress(points) — 현재 레벨 내 진행도(%)를 반환한다.
 * 최고 레벨이면 100%를 반환한다.
 * @param {number} points
 * @returns {number} 0~100 사이의 진행 퍼센트
 */
function getLevelProgress(points) {
  const idx = getLevelIndex(points);

  // 최고 레벨이면 진행 바 꽉 채움
  if (idx === LEVELS.length - 1) return 100;

  const currentMin = LEVELS[idx].minPts;       // 현재 레벨 시작 포인트
  const nextMin    = LEVELS[idx + 1].minPts;   // 다음 레벨 시작 포인트
  const range      = nextMin - currentMin;      // 이 레벨의 구간 크기
  const earned     = points - currentMin;       // 이 레벨에서 쌓은 포인트

  // Math.round: 소수점 반올림 / Math.min: 100을 초과하지 않게 제한
  return Math.min(Math.round((earned / range) * 100), 100);
}

/**
 * getPtsToNext(points) — 다음 레벨까지 필요한 포인트를 반환한다.
 * 최고 레벨이면 0을 반환한다.
 * @param {number} points
 * @returns {number}
 */
function getPtsToNext(points) {
  const idx = getLevelIndex(points);
  if (idx === LEVELS.length - 1) return 0;
  return LEVELS[idx + 1].minPts - points;
}


// ─────────────────────────────────────────────
//  7. 레벨 카드 화면 업데이트 함수
// ─────────────────────────────────────────────

/**
 * updateLevelUI(prevPoints) — 레벨 카드 전체를 현재 포인트에 맞게 갱신한다.
 * 레벨업이 발생했으면 토스트 팝업을 띄운다.
 *
 * @param {number|null} prevPoints - 업데이트 직전 포인트 (레벨업 감지용). null이면 체크 안 함.
 */
function updateLevelUI(prevPoints) {
  const idx   = getLevelIndex(totalPoints);
  const level = LEVELS[idx];             // 현재 레벨 객체
  const pct   = getLevelProgress(totalPoints);  // 진행 바 %
  const toNext = getPtsToNext(totalPoints);

  // ① 아이콘, 레벨 번호, 레벨명 업데이트
  levelIconEl.textContent   = level.icon;
  levelNumEl.textContent    = idx + 1;     // 인덱스 0 → "1"로 표시
  levelNameEl.textContent   = level.name;

  // ② 총 포인트 표시
  levelPointsEl.textContent = `${totalPoints} pts`;

  // ③ 진행 바 너비 업데이트
  levelBarFillEl.style.width = `${pct}%`;

  // 최고 레벨이면 바와 텍스트 스타일 변경
  const isMaxed = (idx === LEVELS.length - 1);
  if (isMaxed) {
    levelBarFillEl.classList.add('maxed');
    levelNextEl.textContent = '🎖️ 최고 레벨 달성! 대단해!';
    levelNextEl.classList.add('maxed');
  } else {
    levelBarFillEl.classList.remove('maxed');
    levelNextEl.textContent = `다음 레벨까지 ${toNext} pts`;
    levelNextEl.classList.remove('maxed');
  }

  // ④ 레벨업 감지: 이전 포인트가 주어졌고, 레벨 인덱스가 올랐으면 토스트 표시
  if (prevPoints !== null) {
    const prevIdx = getLevelIndex(prevPoints);
    if (idx > prevIdx) {
      showLevelupToast(idx + 1, level);
    }
  }

  // ⑤ 포인트 숫자 팝 애니메이션
  triggerPop(levelPointsEl, 'pop-pts', 300);
}

/**
 * showLevelupToast(levelNum, levelObj) — 레벨업 축하 토스트를 화면 중앙에 표시한다.
 * @param {number} levelNum  - 새로 달성한 레벨 번호 (1~5)
 * @param {object} levelObj  - 해당 레벨의 { name, icon }
 */
function showLevelupToast(levelNum, levelObj) {
  levelupIconEl.textContent  = levelObj.icon;
  levelupTitleEl.textContent = '🎊 레벨 업!';
  levelupSubEl.textContent   = `Lv.${levelNum} [${levelObj.name}] 달성!`;

  levelupToastEl.classList.add('show');

  // 레벨 아이콘 팝 애니메이션
  triggerPop(levelIconEl, 'pop-icon', 500);
  triggerPop(levelNumEl,  'pop-num',  500);

  // 2.2초 후 토스트 숨기기
  setTimeout(() => {
    levelupToastEl.classList.remove('show');
  }, 2200);
}

/**
 * triggerPop(el, cls, duration) — 요소에 팝 애니메이션 클래스를 붙였다 뗀다.
 * @param {HTMLElement} el       - 대상 요소
 * @param {string}      cls      - 붙일 CSS 클래스명
 * @param {number}      duration - 클래스를 유지할 시간(ms)
 */
function triggerPop(el, cls, duration) {
  el.classList.remove(cls);
  // requestAnimationFrame 두 번: 클래스 제거 후 브라우저가 리렌더링하게 기다림
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), duration);
    });
  });
}


// ─────────────────────────────────────────────
//  8. 초기화 함수
// ─────────────────────────────────────────────

/**
 * init() — 페이지 첫 로드 시 localStorage에서 데이터를 불러와 화면을 복원한다.
 */
function init() {
  // 총 완료 횟수 복원
  completionCount = parseInt(localStorage.getItem(STORAGE_KEY_COUNT))  || 0;
  countEl.textContent = completionCount;

  // 총 포인트 복원
  totalPoints = parseInt(localStorage.getItem(STORAGE_KEY_POINTS)) || 0;

  // 레벨 카드 초기 렌더링 (레벨업 체크 없이)
  updateLevelUI(null);

  // 완료 기록 목록 복원
  const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
  const history = saved ? JSON.parse(saved) : [];
  history.forEach((record, index) => {
    renderHistoryItem(record, index + 1, false);
  });

  updateHistoryUI();
}


// ─────────────────────────────────────────────
//  9. 미션 뽑기 & 완료
// ─────────────────────────────────────────────

/**
 * drawMission() — [미션 뽑기] 버튼 클릭 시 실행
 */
function drawMission() {
  // ① 랜덤 인덱스 뽑기 (직전과 다른 번호)
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * missions.length);
  } while (randomIndex === lastMissionIndex && missions.length > 1);

  lastMissionIndex   = randomIndex;
  currentMissionText = missions[randomIndex];

  // ② 카드 뒤집기 애니메이션
  missionCardEl.classList.remove('flip');
  missionTextEl.classList.remove('fade-in');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      missionCardEl.classList.add('flip');
      missionTextEl.classList.add('fade-in');
    });
  });

  // ③ 미션 텍스트 교체
  missionTextEl.textContent = currentMissionText;

  // ④ 힌트 & 버튼 상태 변경
  cardHintEl.textContent = '미션을 수행한 뒤 완료 버튼을 눌러줘! 💪';
  cardHintEl.classList.add('active');
  completeBtnEl.disabled = false;

  // ⑤ 이전 축하 메시지 숨기기
  hideCongrats();

  missionDrawn = true;

  missionCardEl.addEventListener('animationend', () => {
    missionCardEl.classList.remove('flip');
  }, { once: true });
}

/**
 * completeMission() — [미션 완료] 버튼 클릭 시 실행
 */
function completeMission() {
  if (!missionDrawn) return;

  // ① 이전 포인트 기억 (레벨업 감지용)
  const prevPoints = totalPoints;

  // ② 완료 횟수 증가 & 저장
  completionCount++;
  countEl.textContent = completionCount;
  localStorage.setItem(STORAGE_KEY_COUNT, String(completionCount));

  // ③ 포인트 증가 & 저장
  totalPoints += POINTS_PER_MISSION;
  localStorage.setItem(STORAGE_KEY_POINTS, String(totalPoints));

  // ④ 완료 횟수 배지 팝 애니메이션
  triggerPop(countEl, 'pop', 300);

  // ⑤ 레벨 카드 업데이트 (레벨업이면 토스트 자동 표시)
  updateLevelUI(prevPoints);

  // ⑥ 완료 기록 저장
  saveHistoryRecord(currentMissionText);

  // ⑦ 축하 메시지 표시
  showCongrats();

  // ⑧ 버튼 & 힌트 리셋
  completeBtnEl.disabled = true;
  cardHintEl.textContent = '새 미션을 뽑으려면 위의 버튼을 눌러줘! 🎲';
  cardHintEl.classList.remove('active');

  missionDrawn       = false;
  currentMissionText = '';
}


// ─────────────────────────────────────────────
//  10. 완료 기록 관련 함수들
// ─────────────────────────────────────────────

/**
 * saveHistoryRecord(missionText) — 완료 기록을 저장하고 화면에 추가한다.
 */
function saveHistoryRecord(missionText) {
  const saved   = localStorage.getItem(STORAGE_KEY_HISTORY);
  const history = saved ? JSON.parse(saved) : [];

  const record = {
    mission: missionText,
    time:    new Date().toISOString(),
    points:  totalPoints,  // 완료 시점의 누적 포인트도 같이 기록
  };

  history.push(record);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

  renderHistoryItem(record, history.length, true);
  updateHistoryUI();
}

/**
 * renderHistoryItem(record, num, isNew) — 기록 하나를 <li>로 만들어 목록에 추가한다.
 */
function renderHistoryItem(record, num, isNew) {
  const li = document.createElement('li');
  li.className = 'history-item';

  const date = new Date(record.time);
  const formattedTime = formatTime(date);

  // 완료 시 획득 포인트 표시 (저장된 기록에 points 필드가 없으면 +10으로 표시)
  li.innerHTML = `
    <span class="history-item-num">${num}</span>
    <div class="history-item-body">
      <div class="history-item-mission">${record.mission}</div>
      <div class="history-item-time">⏰ ${formattedTime} &nbsp;·&nbsp; <span style="color:#0d8c4f;font-weight:700;">+${POINTS_PER_MISSION} pts</span></div>
    </div>
  `;

  if (isNew) {
    historyListEl.prepend(li);
    renumberItems();
  } else {
    historyListEl.append(li);
  }
}

/**
 * renumberItems() — 목록 항목 번호를 1번부터 다시 매긴다.
 */
function renumberItems() {
  const items = historyListEl.querySelectorAll('.history-item-num');
  items.forEach((numEl, index) => {
    numEl.textContent = index + 1;
  });
}

/**
 * updateHistoryUI() — 기록 유무에 따라 빈 상태 / 삭제 버튼을 전환한다.
 */
function updateHistoryUI() {
  const count = historyListEl.querySelectorAll('.history-item').length;
  if (count > 0) {
    historyEmptyEl.style.display = 'none';
    clearBtnEl.style.display = 'block';
  } else {
    historyEmptyEl.style.display = '';
    clearBtnEl.style.display = 'none';
  }
}

/**
 * clearHistory() — 모든 완료 기록을 삭제한다. 포인트·레벨·횟수는 유지.
 */
function clearHistory() {
  const confirmed = window.confirm('완료 기록을 모두 삭제할까요?\n(완료 횟수와 포인트는 유지됩니다)');
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY_HISTORY);
  historyListEl.innerHTML = '';
  updateHistoryUI();
}


// ─────────────────────────────────────────────
//  11. 유틸리티 함수
// ─────────────────────────────────────────────

/**
 * formatTime(date) — Date 객체를 "5월 20일 오후 2:35" 형식으로 변환한다.
 */
function formatTime(date) {
  const month  = date.getMonth() + 1;
  const day    = date.getDate();
  const hours  = date.getHours();
  const minutes = date.getMinutes();
  const ampm   = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 || 12;
  const minStr = String(minutes).padStart(2, '0');
  return `${month}월 ${day}일 ${ampm} ${hour12}:${minStr}`;
}

/**
 * showCongrats() — 축하 메시지를 2.5초 동안 표시한다.
 */
function showCongrats() {
  congratsEl.classList.add('show');
  setTimeout(() => hideCongrats(), 2500);
}

/**
 * hideCongrats() — 축하 메시지를 숨긴다.
 */
function hideCongrats() {
  congratsEl.classList.remove('show');
}


// ─────────────────────────────────────────────
//  앱 시작
// ─────────────────────────────────────────────
init();
