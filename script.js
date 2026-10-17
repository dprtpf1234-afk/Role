/**
 * ==========================================================================
 * 우리 반 1인 1역할 배정 시스템 - script.js (Apple Design Edition)
 * 기능: 무작위 매칭, Apple 햅틱 오디오, A4 인쇄, 로컬스토리지 보관, 구글 스프레드시트 연동 준비
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
      // Apple AirDrop 스타일의 맑고 정교한 투톤 글래스 차임 (880Hz -> 1760Hz)
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
      // Apple 트랙패드 햅틱 탭 사운드
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
  }, 2400);
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

  // 역할을 무작위로 셔플
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
    // 초기 상태
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
    // 배정 완료 상태
    state.assignments.forEach((item, index) => {
      const card = createCardElement(item, index, true);
      container.appendChild(card);
    });
  }

  // 인쇄 전용 헤더 정보 동기화
  syncPrintHeader();
}

// 9. 개별 애플 벤토 카드 엘리먼트 생성
function createCardElement(item, index, isAssigned) {
  const card = document.createElement('div');
  card.className = 'role-card';
  card.style.animationDelay = `${index * 0.025}s`;

  // 2자리 정밀 숫자 (예: 01, 02 ... 12)
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

  // 수동 변경 이벤트
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

// 15. 구글 스프레드시트(Apps Script) 연동
function openSheetModal(initialTab = 'info') {
  playAppleSound('click');
  const modal = document.getElementById('sheetModal');
  const urlInput = document.getElementById('gasUrlInput');
  if (urlInput) {
    urlInput.value = state.gasUrl || '';
  }
  modal.classList.add('active');
}

async function fetchFromSheet() {
  const url = (document.getElementById('gasUrlInput').value || state.gasUrl).trim();
  if (!url) {
    showToast('⚠️ Google Apps Script URL을 입력하세요.');
    return;
  }

  state.gasUrl = url;
  saveToStorage();

  const statusEl = document.getElementById('sheetSyncStatus');
  if (statusEl) {
    statusEl.textContent = '스프레드시트에서 데이터를 동기화하는 중...';
    statusEl.style.color = '#0071E3';
  }

  try {
    const response = await fetch(`${url}?action=getData`, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`응답 오류 (${response.status})`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.students)) {
      state.students = data.students;
      if (Array.isArray(data.roles)) state.roles = data.roles;
      if (data.className) state.className = data.className;

      saveToStorage();
      renderCards();
      updateStats();
      syncInputs();

      if (statusEl) {
        statusEl.textContent = `동기화 완료: 학생 ${data.students.length}명, 역할 ${data.roles ? data.roles.length : 0}개 수신`;
        statusEl.style.color = '#34C759';
      }
      showToast('시트 데이터를 성공적으로 불러왔습니다.');
    } else {
      throw new Error('데이터 형식이 올바르지 않습니다.');
    }
  } catch (err) {
    console.warn('Apps Script fetch failed:', err);
    if (statusEl) {
      statusEl.textContent = `시트 연결 실패 (${err.message}). 안내 탭의 코드가 배포되었는지 확인하세요.`;
      statusEl.style.color = '#FF3B30';
    }
    showToast('⚠️ 시트 통신 오류가 발생했습니다.');
  }
}

async function saveToSheet() {
  const url = (document.getElementById('gasUrlInput').value || state.gasUrl).trim();
  if (!url) {
    showToast('⚠️ Google Apps Script URL을 입력하세요.');
    return;
  }

  state.gasUrl = url;
  saveToStorage();

  if (state.assignments.length === 0) {
    showToast('⚠️ 먼저 역할을 배정하세요.');
    return;
  }

  const statusEl = document.getElementById('sheetSyncStatus');
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
      statusEl.textContent = '스프레드시트에 배정 결과가 저장되었습니다.';
      statusEl.style.color = '#34C759';
    }
    showToast('시트에 결과 저장을 완료했습니다.');
  } catch (err) {
    console.warn('Apps Script post failed:', err);
    if (statusEl) {
      statusEl.textContent = `시트 저장 오류: ${err.message}`;
      statusEl.style.color = '#FF3B30';
    }
    showToast('⚠️ 시트 저장 중 문제가 발생했습니다.');
  }
}

// 16. 학생 및 역할 관리 모달
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

// 17. 인라인 입력 동기화
function syncInputs() {
  const classInput = document.getElementById('classInput');
  const termInput = document.getElementById('termInput');
  if (classInput) classInput.value = state.className;
  if (termInput) termInput.value = state.termName;
}

// 18. 이벤트 리스너 등록
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

// 19. 초기화 실행
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
  state
};
