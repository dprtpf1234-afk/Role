/**
 * ==========================================================================
 * 우리 반 1인 1역할 배정 시스템 - script.js (Apple Design & Enhanced Google Sheets Sync)
 * 기능: 무작위 매칭, Apple 햅틱 오디오, A4 인쇄, 로컬스토리지 보관,
 *       Google Sheets 직접 링크/Apps Script Web App/클립보드 붙여넣기 3-way 완벽 동기화
 * ==========================================================================
 */

// 1. 기본 예시 데이터 (학생 12명 & 역할 12개)
const DEFAULT_STUDENTS = [
  "김민준", "이서아", "박도윤", "최지우",
  "정하준", "강서연", "윤은우", "조시은",
  "서지호", "임다은", "한지후", "오예린"
];

const DEFAULT_ROLES = [
  { id: 1, name: "칠판 도우미", icon: "🧼", desc: "쉬는 시간마다 칠판을 깨끗하게 정리하고 분필을 정돈합니다." },
  { id: 2, name: "우유 도우미", icon: "🥛", desc: "아침 우유 수량을 확인하고 친구들에게 안전하게 배부합니다." },
  { id: 3, name: "급식 도우미", icon: "🍱", desc: "식사 전 손 씻기와 급식 줄서기, 식판 정리를 안내합니다." },
  { id: 4, name: "환기·창문 도우미", icon: "🪟", desc: "중간 놀이와 점심시간에 창문을 열어 교실 공기를 쾌적하게 유지합니다." },
  { id: 5, name: "소등·에너지 도우미", icon: "💡", desc: "이동 수업이나 체육 시간 시 전등과 전자칠판을 소등합니다." },
  { id: 6, name: "도서 도우미", icon: "📚", desc: "학급 문고의 책을 번호순으로 정갈하게 정리정돈합니다." },
  { id: 7, name: "분리수거 도우미", icon: "♻️", desc: "종이와 플라스틱 등 재활용품이 올바르게 분리배출되도록 돕습니다." },
  { id: 8, name: "식물·화분 도우미", icon: "🪴", desc: "교실 화분의 토양을 살피고 주기적으로 수분을 공급합니다." },
  { id: 9, name: "위생·청결 도우미", icon: "🧴", desc: "손 소독제 잔량을 점검하고 교실 내 방역 비품을 관리합니다." },
  { id: 10, name: "체육·교구 도우미", icon: "⚽", desc: "체육 활동 기구 및 수업 교구를 안전하게 챙기고 반납합니다." },
  { id: 11, name: "학습지·유인물 도우미", icon: "📑", desc: "가정통신문과 수업 학습지를 분단별로 균등하게 배부합니다." },
  { id: 12, name: "소식·전달 도우미", icon: "💌", desc: "선생님의 주요 공지사항과 교무실 전달 업무를 지원합니다." }
];

// 2. 상태 저장 객체
const state = {
  className: "3학년 2반",
  termName: "2026학년도 1학기",
  students: [...DEFAULT_STUDENTS],
  roles: JSON.parse(JSON.stringify(DEFAULT_ROLES)),
  assignments: [],
  gasUrl: ""
};

// 3. Apple AirDrop / macOS 햅틱 사운드 합성 (Web Audio API)
function playAppleSound(type = 'shuffle') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'shuffle') {
      const notes = [
        { freq: 880.00, time: 0.00, dur: 0.22, vol: 0.12 },
        { freq: 1318.51, time: 0.08, dur: 0.26, vol: 0.14 },
        { freq: 1760.00, time: 0.16, dur: 0.40, vol: 0.16 }
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

        gain.gain.setValueAtTime(note.vol, ctx.currentTime + note.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + note.time + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + note.time);
        osc.stop(ctx.currentTime + note.time + note.dur + 0.05);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {
    console.debug('Audio autoplay prevented or unsupported', e);
  }
}

// 4. 로컬스토리지 저장 및 불러오기
function saveToStorage() {
  const dataToSave = {
    className: state.className,
    termName: state.termName,
    students: state.students,
    roles: state.roles,
    assignments: state.assignments,
    gasUrl: state.gasUrl
  };
  localStorage.setItem('class_role_system_apple_data', JSON.stringify(dataToSave));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('class_role_system_apple_data') ||
                localStorage.getItem('class_role_system_ghibli_data') ||
                localStorage.getItem('class_role_system_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.className) state.className = parsed.className;
      if (parsed.termName) state.termName = parsed.termName;
      if (Array.isArray(parsed.students) && parsed.students.length > 0) state.students = parsed.students;
      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) state.roles = parsed.roles;
      if (Array.isArray(parsed.assignments)) state.assignments = parsed.assignments;
      if (parsed.gasUrl) state.gasUrl = parsed.gasUrl;
    }
  } catch (err) {
    console.error('Failed to parse localStorage data', err);
  }
}

// 5. 애플 햅틱 토스트 알림
function showToast(message) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// 6. 무작위 셔플 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 7. [🎲 역할 배정하기] 핵심 로직
function assignRoles() {
  playAppleSound('shuffle');

  if (state.students.length === 0 || state.roles.length === 0) {
    showToast('⚠️ 학생 명단과 역할을 먼저 확인하세요.');
    return;
  }

  const shuffledRoles = shuffleArray(state.roles);
  const newAssignments = [];

  state.students.forEach((student, index) => {
    const role = shuffledRoles[index % shuffledRoles.length];
    newAssignments.push({
      number: index + 1,
      studentName: student,
      role: { ...role }
    });
  });

  state.assignments = newAssignments;
  saveToStorage();
  renderCards();
  updateStats();
  showToast('역할 배정이 완료되었습니다.');
}

// 8. 벤토 카드 그리드 렌더링
function renderCards() {
  const container = document.getElementById('assignmentGrid');
  if (!container) return;

  container.innerHTML = '';

  if (state.assignments.length === 0) {
    state.students.forEach((student, index) => {
      const defaultRole = state.roles[index % state.roles.length] || { name: '역할 대기 중', icon: '✨', desc: '역할 배정하기를 클릭하세요.' };
      const card = createCardElement({
        number: index + 1,
        studentName: student,
        role: defaultRole
      }, index, false);
      container.appendChild(card);
    });
  } else {
    state.assignments.forEach((item, index) => {
      const card = createCardElement(item, index, true);
      container.appendChild(card);
    });
  }

  syncPrintHeader();
}

// 9. 개별 애플 벤토 카드 엘리먼트 생성
function createCardElement(item, index, isAssigned) {
  const card = document.createElement('div');
  card.className = 'role-card';
  card.style.animationDelay = `${index * 0.025}s`;

  const formattedNumber = String(item.number).padStart(2, '0');

  card.innerHTML = `
    <div class="card-header-bar">
      <span class="card-student-number">${formattedNumber}</span>
      <span class="card-role-icon" title="${item.role.name}">${item.role.icon || '✨'}</span>
    </div>
    <div class="card-body">
      <div class="student-name-row">
        <h3 class="student-name">${item.studentName}</h3>
        <span class="student-tag">${isAssigned ? '배정 완료' : '대기'}</span>
      </div>
      <div class="role-title-box">
        <span class="role-name">${item.role.name}</span>
      </div>
      <p class="role-description">${item.role.desc || '학급을 위한 소중한 책임을 실천합니다.'}</p>
    </div>
    <div class="card-footer-actions">
      <button class="btn-card-swap" data-index="${index}" title="역할 변경">
        역할 변경
      </button>
    </div>
  `;

  const swapBtn = card.querySelector('.btn-card-swap');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      openRoleChangeModal(index);
    });
  }

  return card;
}

// 10. 수동 역할 변경 모달
function openRoleChangeModal(studentIndex) {
  const student = state.assignments[studentIndex] || {
    number: studentIndex + 1,
    studentName: state.students[studentIndex],
    role: state.roles[studentIndex % state.roles.length]
  };

  const currentRoleName = student.role ? student.role.name : '';
  const modal = document.getElementById('roleChangeModal');
  const titleEl = document.getElementById('roleChangeStudentTitle');
  const selectEl = document.getElementById('roleChangeSelect');

  if (titleEl) {
    titleEl.textContent = `${student.studentName} 학생 역할 변경`;
  }

  if (selectEl) {
    selectEl.innerHTML = '';
    state.roles.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.icon} ${r.name} - ${r.desc.slice(0, 26)}...`;
      if (r.name === currentRoleName) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  modal.setAttribute('data-target-index', studentIndex);
  modal.classList.add('active');
}

// 11. 통계 지표 업데이트
function updateStats() {
  const totalStudentsEl = document.getElementById('statTotalStudents');
  const totalRolesEl = document.getElementById('statTotalRoles');
  const assignedCountEl = document.getElementById('statAssignedCount');

  if (totalStudentsEl) totalStudentsEl.textContent = `${state.students.length}`;
  if (totalRolesEl) totalRolesEl.textContent = `${state.roles.length}`;
  if (assignedCountEl) {
    const count = state.assignments.length;
    assignedCountEl.textContent = `${count} / ${state.students.length}`;
  }
}

// 12. 인쇄용 헤더 동기화
function syncPrintHeader() {
  const printTitle = document.getElementById('printTitle');
  const printClass = document.getElementById('printClass');
  const printDate = document.getElementById('printDate');

  if (printTitle) printTitle.textContent = `우리 반 1인 1역할 배정표`;
  if (printClass) printClass.textContent = `학급: ${state.className}`;
  if (printDate) printDate.textContent = `배정 일자: ${state.termName}`;
}

// 13. [🖨️ A4 인쇄하기]
function printA4Sheet() {
  playAppleSound('click');
  syncPrintHeader();
  window.print();
}

// 14. [📋 결과 텍스트 복사] (알림장, 메신저용)
function copyResultText() {
  playAppleSound('click');

  if (state.assignments.length === 0) {
    showToast('⚠️ 먼저 [역할 배정하기]를 실행하세요.');
    return;
  }

  let text = `[${state.className} 1인 1역할 배정표 (${state.termName})]\n\n`;
  state.assignments.forEach((item) => {
    text += `${String(item.number).padStart(2, '0')}. ${item.studentName}: ${item.role.icon} ${item.role.name} (${item.role.desc})\n`;
  });
  text += `\n"한 사람 한 사람의 책임이 만드는 특별한 교실"`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('결과가 클립보드에 복사되었습니다.');
    }).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('결과가 클립보드에 복사되었습니다.');
  } catch (err) {
    showToast('복사에 실패했습니다.');
  }
  document.body.removeChild(textArea);
}

// 15. CSV 파서 유틸리티
function parseCsvRows(csvText) {
  const rows = [];
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

  for (const line of lines) {
    const row = [];
    let inQuotes = false;
    let token = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(token.trim().replace(/^"|"$/g, '').trim());
        token = '';
      } else {
        token += char;
      }
    }
    row.push(token.trim().replace(/^"|"$/g, '').trim());
    rows.push(row);
  }
  return rows;
}

// JSONP 통신 헬퍼 (CORS 차단 원천 우회)
function fetchViaJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = 'gas_callback_' + Date.now();
    const script = document.createElement('script');
    const sep = url.includes('?') ? '&' : '?';

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP 타임아웃 (서버 응답 없음)'));
    }, 9000);

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('스크립트 로드 실패'));
    };

    script.src = `${url}${sep}callback=${callbackName}&action=getData&_t=${Date.now()}`;
    document.head.appendChild(script);
  });
}

// 16. 구글 스프레드시트 연동 (직접 링크 & Apps Script & JSONP 통합)
function openSheetModal(initialTab = 'info') {
  playAppleSound('click');
  const modal = document.getElementById('sheetModal');
  const urlInput = document.getElementById('gasUrlInput');
  const troubleshootBox = document.getElementById('sheetTroubleshootBox');

  if (urlInput) {
    urlInput.value = state.gasUrl || '';
  }
  if (troubleshootBox) {
    troubleshootBox.style.display = 'none';
  }

  modal.classList.add('active');
}

// [🔄 시트에서 불러오기]
async function fetchFromSheet() {
  playAppleSound('click');
  const inputEl = document.getElementById('gasUrlInput');
  const url = (inputEl ? inputEl.value : state.gasUrl).trim();
  const statusEl = document.getElementById('sheetSyncStatus');
  const troubleshootBox = document.getElementById('sheetTroubleshootBox');

  if (troubleshootBox) troubleshootBox.style.display = 'none';

  if (!url) {
    showToast('⚠️ 구글 시트 URL 또는 웹 앱 URL을 입력하세요.');
    if (statusEl) {
      statusEl.textContent = '⚠️ URL이 입력되지 않았습니다. 구글 시트 링크나 Apps Script 주소를 입력하세요.';
      statusEl.style.color = '#FF3B30';
    }
    return;
  }

  state.gasUrl = url;
  saveToStorage();

  // CASE 1: 구글 스프레드시트 일반 URL인 경우 (docs.google.com/spreadsheets/d/...)
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch) {
    const sheetId = sheetMatch[1];
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}&_t=${Date.now()}`;

    if (statusEl) {
      statusEl.textContent = '💡 구글 스프레드시트 링크 감지! 시트 데이터를 실시간 변환 중...';
      statusEl.style.color = '#0071E3';
    }

    try {
      const response = await fetch(gvizUrl, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`스프레드시트 접근 불가 (상태 코드: ${response.status})`);
      }

      const csvText = await response.text();

      // 로그인 화면 HTML이 반환된 경우 (비공개 시트)
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('accounts.google.com')) {
        throw new Error('시트가 비공개 상태입니다. 공유 권한을 확인하세요.');
      }

      const rows = parseCsvRows(csvText);
      if (rows.length === 0) {
        throw new Error('시트에 내용이 비어 있습니다.');
      }

      // 첫 행이 헤더인지 체크
      let startIndex = 0;
      const firstRowStr = rows[0].join(' ').toLowerCase();
      if (firstRowStr.includes('이름') || firstRowStr.includes('학생') || firstRowStr.includes('역할') || firstRowStr.includes('번호')) {
        startIndex = 1;
      }

      const parsedStudents = [];
      const parsedRoles = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // 번호 열이 있는 경우 감지: 첫 열이 숫자이고 두 번째 열이 텍스트인 경우
        let studentCol = 0;
        let roleCol = 1;
        let iconCol = 2;
        let descCol = 3;

        if (row.length >= 2 && !isNaN(row[0]) && row[0] !== '' && isNaN(row[1])) {
          studentCol = 1;
          roleCol = 2;
          iconCol = 3;
          descCol = 4;
        }

        const student = (row[studentCol] || '').trim();
        const role = (row[roleCol] || '').trim();
        const icon = (row[iconCol] || '').trim();
        const desc = (row[descCol] || '').trim();

        if (student) parsedStudents.push(student);
        if (role) {
          // 이모지 분리
          const emojiMatch = role.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji_Presentation})/u);
          let finalIcon = icon || '✨';
          let finalName = role;
          if (emojiMatch && !icon) {
            finalIcon = emojiMatch[0];
            finalName = role.slice(finalIcon.length).trim();
          }

          parsedRoles.push({
            id: parsedRoles.length + 1,
            name: finalName || `역할 ${parsedRoles.length + 1}`,
            icon: finalIcon,
            desc: desc || '학급을 위한 책임을 다합니다.'
          });
        }
      }

      if (parsedStudents.length > 0) {
        state.students = parsedStudents;
        if (parsedRoles.length > 0) {
          state.roles = parsedRoles;
        }
        saveToStorage();
        renderCards();
        updateStats();

        if (statusEl) {
          statusEl.textContent = `✅ 성공: 구글 시트에서 학생 ${parsedStudents.length}명, 역할 ${parsedRoles.length}개를 가져왔습니다!`;
          statusEl.style.color = '#34C759';
        }
        showToast('스프레드시트 명단을 성공적으로 불러왔습니다.');
        return;
      } else {
        throw new Error('시트에서 유효한 학생 이름을 찾을 수 없습니다.');
      }
    } catch (sheetErr) {
      console.warn('Direct Google Sheet fetch failed:', sheetErr);
      if (statusEl) {
        statusEl.textContent = `⚠️ 구글 시트 연결 실패: ${sheetErr.message}`;
        statusEl.style.color = '#FF3B30';
      }
      if (troubleshootBox) troubleshootBox.style.display = 'block';
      showToast('⚠️ 구글 시트 공유 권한 설정을 확인해 주세요.');
      return;
    }
  }

  // CASE 2: Apps Script URL (/dev 감지)
  if (url.includes('/dev')) {
    if (statusEl) {
      statusEl.textContent = "⚠️ '/dev' 주소가 감지되었습니다. /dev는 테스트용이라 권한 오류(Failed to fetch)가 발생합니다. Apps Script의 [배포 관리]에서 '/exec' URL을 복사해 주세요.";
      statusEl.style.color = '#FF3B30';
    }
    if (troubleshootBox) troubleshootBox.style.display = 'block';
    showToast("⚠️ '/exec' 배포 URL을 입력해야 합니다.");
    return;
  }

  // CASE 3: Apps Script Web App URL (/exec)
  if (statusEl) {
    statusEl.textContent = '스프레드시트에서 데이터를 동기화하는 중...';
    statusEl.style.color = '#0071E3';
  }

  let data = null;

  // 1차 시도: 표준 fetch
  try {
    const fetchUrl = url.includes('?') ? `${url}&action=getData&_t=${Date.now()}` : `${url}?action=getData&_t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow'
    });

    if (response.ok) {
      data = await response.json();
    } else {
      throw new Error(`응답 상태 코드 ${response.status}`);
    }
  } catch (fetchErr) {
    console.warn('Standard fetch failed, attempting JSONP fallback...', fetchErr);
    // 2차 시도: JSONP fallback (CORS 원천 우회)
    try {
      data = await fetchViaJsonp(url);
    } catch (jsonpErr) {
      console.warn('JSONP fallback also failed:', jsonpErr);
      if (statusEl) {
        statusEl.textContent = `시트 연결 실패 (Failed to fetch). 아래 해결 가이드를 확인하세요.`;
        statusEl.style.color = '#FF3B30';
      }
      if (troubleshootBox) troubleshootBox.style.display = 'block';
      showToast('⚠️ 시트 통신 오류가 발생했습니다.');
      return;
    }
  }

  if (data && Array.isArray(data.students)) {
    state.students = data.students;
    if (Array.isArray(data.roles) && data.roles.length > 0) state.roles = data.roles;
    if (data.className) state.className = data.className;

    saveToStorage();
    renderCards();
    updateStats();
    syncInputs();

    if (statusEl) {
      statusEl.textContent = `✅ 동기화 완료: 학생 ${data.students.length}명, 역할 ${data.roles ? data.roles.length : 0}개 수신`;
      statusEl.style.color = '#34C759';
    }
    showToast('시트 데이터를 성공적으로 불러왔습니다.');
  } else {
    if (statusEl) {
      statusEl.textContent = '⚠️ 수신된 데이터 형식이 올바르지 않습니다.';
      statusEl.style.color = '#FF3B30';
    }
    if (troubleshootBox) troubleshootBox.style.display = 'block';
    showToast('⚠️ 데이터 형식을 확인하세요.');
  }
}

// [💾 시트에 결과 저장]
async function saveToSheet() {
  playAppleSound('click');
  const inputEl = document.getElementById('gasUrlInput');
  const url = (inputEl ? inputEl.value : state.gasUrl).trim();
  const statusEl = document.getElementById('sheetSyncStatus');
  const troubleshootBox = document.getElementById('sheetTroubleshootBox');

  if (!url) {
    showToast('⚠️ 저장할 Google Apps Script 웹 앱 URL을 입력하세요.');
    return;
  }

  state.gasUrl = url;
  saveToStorage();

  if (state.assignments.length === 0) {
    showToast('⚠️ 먼저 역할을 배정하세요.');
    return;
  }

  // 만약 구글 시트 일반 링크인 경우 안내
  if (url.includes('docs.google.com/spreadsheets/d/')) {
    if (statusEl) {
      statusEl.textContent = '💡 구글 시트에 직접 쓰기 저장은 Apps Script 웹 앱 URL이 필요합니다. 또는 [시트 셀 직접 붙여넣기] 탭의 [현재 배정결과 시트용 복사] 버튼을 이용해 간편히 붙여넣으세요!';
      statusEl.style.color = '#0071E3';
    }
    showToast('시트용 복사 기능을 이용해 간편히 붙여넣으세요.');
    return;
  }

  if (statusEl) {
    statusEl.textContent = '스프레드시트에 결과를 백업하는 중...';
    statusEl.style.color = '#0071E3';
  }

  const payload = {
    className: state.className,
    termName: state.termName,
    savedAt: new Date().toISOString(),
    assignments: state.assignments
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (statusEl) {
      statusEl.textContent = '✅ 스프레드시트에 배정 결과 저장을 요청했습니다.';
      statusEl.style.color = '#34C759';
    }
    showToast('시트에 결과 저장을 완료했습니다.');
  } catch (err) {
    console.warn('Apps Script post failed:', err);
    if (statusEl) {
      statusEl.textContent = `시트 저장 오류: ${err.message}`;
      statusEl.style.color = '#FF3B30';
    }
    if (troubleshootBox) troubleshootBox.style.display = 'block';
    showToast('⚠️ 시트 저장 중 문제가 발생했습니다.');
  }
}

// 17. [시트 셀 직접 붙여넣기] 파싱 적용
function applyPastedSheetData() {
  playAppleSound('click');
  const textarea = document.getElementById('sheetPasteArea');
  const msgEl = document.getElementById('pasteStatusMsg');

  if (!textarea || !textarea.value.trim()) {
    showToast('⚠️ 붙여넣을 시트 내용을 먼저 입력하세요.');
    return;
  }

  const rawText = textarea.value.trim();
  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    showToast('내용이 비어 있습니다.');
    return;
  }

  const parsedStudents = [];
  const parsedRoles = [];

  // 첫 줄이 헤더인지 판별
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('이름') || firstLine.includes('학생') || firstLine.includes('역할') || firstLine.includes('번호')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // 탭 또는 쉼표 또는 파이프로 분리
    let cols = [];
    if (line.includes('\t')) {
      cols = line.split('\t').map(c => c.trim());
    } else if (line.includes(',')) {
      cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    } else if (line.includes('|')) {
      cols = line.split('|').map(c => c.trim());
    } else {
      cols = [line.trim()];
    }

    let studentCol = 0;
    let roleCol = 1;
    let iconCol = 2;
    let descCol = 3;

    // 번호가 첫 열에 있는 경우
    if (cols.length >= 2 && !isNaN(cols[0]) && cols[0] !== '' && isNaN(cols[1])) {
      studentCol = 1;
      roleCol = 2;
      iconCol = 3;
      descCol = 4;
    }

    const student = (cols[studentCol] || '').trim();
    const role = (cols[roleCol] || '').trim();
    const icon = (cols[iconCol] || '').trim();
    const desc = (cols[descCol] || '').trim();

    if (student) parsedStudents.push(student);
    if (role) {
      const emojiMatch = role.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji_Presentation})/u);
      let finalIcon = icon || '✨';
      let finalName = role;
      if (emojiMatch && !icon) {
        finalIcon = emojiMatch[0];
        finalName = role.slice(finalIcon.length).trim();
      }

      parsedRoles.push({
        id: parsedRoles.length + 1,
        name: finalName || `역할 ${parsedRoles.length + 1}`,
        icon: finalIcon,
        desc: desc || '학급을 위한 책임을 다합니다.'
      });
    }
  }

  if (parsedStudents.length === 0) {
    showToast('유효한 학생 이름을 찾을 수 없습니다.');
    return;
  }

  state.students = parsedStudents;
  if (parsedRoles.length > 0) {
    state.roles = parsedRoles;
  }
  state.assignments = [];

  saveToStorage();
  renderCards();
  updateStats();

  if (msgEl) {
    msgEl.style.display = 'block';
    msgEl.textContent = `✅ 적용 완료: 학생 ${parsedStudents.length}명, 역할 ${parsedRoles.length}개가 성공적으로 등록되었습니다!`;
    msgEl.style.color = '#34C759';
  }

  showToast(`학생 ${parsedStudents.length}명 명단이 즉시 적용되었습니다!`);
}

// [시트용 TSV 클립보드 복사]
function copyAssignmentsForSheet() {
  playAppleSound('click');
  if (state.assignments.length === 0) {
    showToast('⚠️ 먼저 역할을 배정하세요.');
    return;
  }

  let tsv = '번호\t학생 이름\t역할\t아이콘\t설명\t배정일시\n';
  const now = new Date().toLocaleString('ko-KR');
  state.assignments.forEach(item => {
    tsv += `${item.number}\t${item.studentName}\t${item.role.name}\t${item.role.icon}\t${item.role.desc}\t${now}\n`;
  });

  if (navigator.clipboard) {
    navigator.clipboard.writeText(tsv).then(() => {
      showToast('📋 시트 붙여넣기용 데이터가 복사되었습니다! 구글 시트에서 Ctrl+V 하세요.');
    });
  } else {
    fallbackCopyText(tsv);
  }
}

// 18. 학생 및 역할 관리 모달
function openManageModal() {
  playAppleSound('click');
  const modal = document.getElementById('manageModal');
  const studentsTextarea = document.getElementById('manageStudentsText');
  const rolesTextarea = document.getElementById('manageRolesText');

  if (studentsTextarea) {
    studentsTextarea.value = state.students.join('\n');
  }

  if (rolesTextarea) {
    rolesTextarea.value = state.roles.map(r => `${r.icon} ${r.name} | ${r.desc}`).join('\n');
  }

  modal.classList.add('active');
}

function saveManagementChanges() {
  const studentsTextarea = document.getElementById('manageStudentsText');
  const rolesTextarea = document.getElementById('manageRolesText');

  if (studentsTextarea) {
    const lines = studentsTextarea.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (lines.length > 0) {
      state.students = lines;
    }
  }

  if (rolesTextarea) {
    const lines = rolesTextarea.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const parsedRoles = [];
    lines.forEach((line, i) => {
      const parts = line.split('|');
      const titlePart = (parts[0] || '').trim();
      const descPart = (parts[1] || '학급을 위한 책임을 다합니다.').trim();

      const emojiMatch = titlePart.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji_Presentation})/u);
      let icon = '✨';
      let name = titlePart;
      if (emojiMatch) {
        icon = emojiMatch[0];
        name = titlePart.slice(icon.length).trim();
      }

      parsedRoles.push({
        id: i + 1,
        name: name || `역할 ${i + 1}`,
        icon: icon,
        desc: descPart
      });
    });

    if (parsedRoles.length > 0) {
      state.roles = parsedRoles;
    }
  }

  saveToStorage();
  renderCards();
  updateStats();
  document.getElementById('manageModal').classList.remove('active');
  showToast('설정이 성공적으로 저장되었습니다.');
}

function resetToDefaultData() {
  if (confirm('기본 12명 예시 데이터로 복원하시겠습니까?')) {
    state.students = [...DEFAULT_STUDENTS];
    state.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    state.assignments = [];
    saveToStorage();
    renderCards();
    updateStats();
    syncInputs();
    document.getElementById('manageModal').classList.remove('active');
    showToast('기본 데이터로 초기화되었습니다.');
  }
}

// 19. 인라인 입력 동기화
function syncInputs() {
  const classInput = document.getElementById('classInput');
  const termInput = document.getElementById('termInput');
  if (classInput) classInput.value = state.className;
  if (termInput) termInput.value = state.termName;
}

// 20. 이벤트 리스너 등록
function initEventListeners() {
  const classInput = document.getElementById('classInput');
  if (classInput) {
    classInput.addEventListener('change', (e) => {
      state.className = e.target.value.trim() || '우리 반';
      saveToStorage();
      syncPrintHeader();
    });
  }

  const termInput = document.getElementById('termInput');
  if (termInput) {
    termInput.addEventListener('change', (e) => {
      state.termName = e.target.value.trim() || '2026학년도';
      saveToStorage();
      syncPrintHeader();
    });
  }

  // 상단 글로벌 네비게이션 버튼
  document.getElementById('btnSheetLoad')?.addEventListener('click', () => openSheetModal('load'));
  document.getElementById('btnSheetSave')?.addEventListener('click', () => openSheetModal('save'));
  document.getElementById('btnManage')?.addEventListener('click', openManageModal);
  document.getElementById('btnPrint')?.addEventListener('click', printA4Sheet);

  // 메인 액션 버튼
  document.getElementById('btnAssignMain')?.addEventListener('click', assignRoles);
  document.getElementById('btnReshuffle')?.addEventListener('click', assignRoles);
  document.getElementById('btnCopyResult')?.addEventListener('click', copyResultText);

  // 모달 닫기
  document.querySelectorAll('.btn-modal-close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // 역할 수동 변경
  document.getElementById('btnConfirmRoleChange')?.addEventListener('click', () => {
    const modal = document.getElementById('roleChangeModal');
    const index = parseInt(modal.getAttribute('data-target-index'), 10);
    const selectEl = document.getElementById('roleChangeSelect');
    if (!isNaN(index) && selectEl) {
      const selectedRoleId = parseInt(selectEl.value, 10);
      const matchedRole = state.roles.find(r => r.id === selectedRoleId);
      if (matchedRole) {
        if (!state.assignments[index]) {
          state.assignments[index] = {
            number: index + 1,
            studentName: state.students[index],
            role: { ...matchedRole }
          };
        } else {
          state.assignments[index].role = { ...matchedRole };
        }
        saveToStorage();
        renderCards();
        showToast(`${state.assignments[index].studentName} 학생의 역할이 변경되었습니다.`);
      }
    }
    modal.classList.remove('active');
  });

  // 시트 모달 이벤트
  document.getElementById('btnDoFetchSheet')?.addEventListener('click', fetchFromSheet);
  document.getElementById('btnDoSaveSheet')?.addEventListener('click', saveToSheet);
  document.getElementById('btnSaveGasUrl')?.addEventListener('click', () => {
    const url = document.getElementById('gasUrlInput').value.trim();
    state.gasUrl = url;
    saveToStorage();
    showToast('URL이 저장되었습니다.');
  });

  // 시트 직접 붙여넣기 탭 이벤트
  document.getElementById('btnApplyPasteData')?.addEventListener('click', applyPastedSheetData);
  document.getElementById('btnCopyForSheet')?.addEventListener('click', copyAssignmentsForSheet);

  // 코드 복사
  document.getElementById('btnCopyGasCode')?.addEventListener('click', () => {
    const code = document.getElementById('gasCodeSnippet').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        showToast('코드가 클립보드에 복사되었습니다.');
      });
    }
  });

  document.getElementById('btnSaveManage')?.addEventListener('click', saveManagementChanges);
  document.getElementById('btnResetManage')?.addEventListener('click', resetToDefaultData);

  // 탭 제어
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      const parent = tab.closest('.modal-content');
      parent.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      parent.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.style.display = 'block';
    });
  });
}

// 21. 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  syncInputs();
  renderCards();
  updateStats();
  initEventListeners();
});

// 전역 window 바인딩
window.classRoleSystem = {
  assignRoles,
  printA4Sheet,
  copyResultText,
  openSheetModal,
  openManageModal,
  fetchFromSheet,
  saveToSheet,
  applyPastedSheetData,
  state
};
