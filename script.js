/**
 * ==========================================================================
 * 우리 반 1인 1역할 배정 시스템 - script.js (지브리 감성 에디션)
 * 기능: 무작위 매칭, 오르골 음악 효과음, A4 인쇄, 로컬스토리지 보관, 구글 스프레드시트 연동 준비
 * ==========================================================================
 */

// 1. 기본 예시 데이터 (학생 12명 & 역할 12개)
const DEFAULT_STUDENTS = [
  "김민준", "이서아", "박도윤", "최지우",
  "정하준", "강서연", "윤은우", "조시은",
  "서지호", "임다은", "한지후", "오예린"
];

const DEFAULT_ROLES = [
  { id: 1, name: "칠판 도우미", icon: "🧼", desc: "쉬는 시간마다 칠판을 깨끗하게 닦고 분필 가루를 털어요." },
  { id: 2, name: "우유 도우미", icon: "🥛", desc: "아침 우유 수량을 확인하고 친구들에게 안전하게 배부해요." },
  { id: 3, name: "급식 도우미", icon: "🍱", desc: "식사 전 손 씻기와 급식 줄서기, 식판 정리를 안내해요." },
  { id: 4, name: "환기·창문 도우미", icon: "🪟", desc: "중간 놀이와 점심시간에 창문을 활짝 열어 숲속 맑은 공기를 채워요." },
  { id: 5, name: "소등·에너지 도우미", icon: "💡", desc: "체육 시간이나 이동 수업 시 전등과 전자칠판을 아껴 꺼요." },
  { id: 6, name: "도서 도우미", icon: "📚", desc: "학급 문고의 책을 번호대로 가지런히 정리정돈해요." },
  { id: 7, name: "분리수거 도우미", icon: "♻️", desc: "종이와 플라스틱 등 재활용품이 바르게 버려졌는지 살펴봐요." },
  { id: 8, name: "식물·화분 도우미", icon: "🪴", desc: "교실 화분의 흙을 만져보고 주기적으로 물을 주며 초록 잎을 돌봐요." },
  { id: 9, name: "위생·청결 도우미", icon: "🧴", desc: "손 소독제 잔량을 확인하고 교실 비품을 청결하게 관리해요." },
  { id: 10, name: "체육·교구 도우미", icon: "⚽", desc: "체육 시간 운동기구와 수업 준비물을 챙기고 반납해요." },
  { id: 11, name: "학습지·유인물 도우미", icon: "📑", desc: "안내장과 학습지를 분단별로 친구들에게 골고루 나눠줘요." },
  { id: 12, name: "우체부·소식 도우미", icon: "💌", desc: "선생님의 중요한 전달 사항과 교무실 심부름을 도와줘요." }
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

// 3. 지브리 스타일 맑은 오르골/실로폰 효과음 (Web Audio API)
function playCuteSound(type = 'shuffle') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'shuffle') {
      // 히사이시 조 음악 감성의 펜타토닉 오르골 아르페지오 (도-미-솔-라-도-레-미)
      const frequencies = [523.25, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      frequencies.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 맑고 영롱한 실로폰/오르골 배음
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.14, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
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
  localStorage.setItem('class_role_system_ghibli_data', JSON.stringify(dataToSave));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('class_role_system_ghibli_data') || localStorage.getItem('class_role_system_data');
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

// 5. 토스트 알림 표시
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
  playCuteSound('shuffle');

  if (state.students.length === 0 || state.roles.length === 0) {
    showToast('⚠️ 학생 명단과 역할 목록을 먼저 확인해 주세요!');
    return;
  }

  // 역할을 무작위로 섞음
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
  showToast('🌿 바람을 타고 우리 반 1인 1역할이 배정되었습니다!');
}

// 8. 카드 렌더링 함수
function renderCards() {
  const container = document.getElementById('assignmentGrid');
  if (!container) return;

  container.innerHTML = '';

  if (state.assignments.length === 0) {
    // 초기 상태: 배정 전 기본 학생-역할 가이드 카드 렌더링
    state.students.forEach((student, index) => {
      const defaultRole = state.roles[index % state.roles.length] || { name: '역할 준비 중', icon: '🌱', desc: '역할 배정하기 버튼을 눌러주세요.' };
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

// 9. 단일 카드 DOM 엘리먼트 생성
function createCardElement(item, index, isAssigned) {
  const card = document.createElement('div');
  const themeIndex = index % 6;
  card.className = `role-card color-theme-${themeIndex}`;
  card.style.animationDelay = `${index * 0.035}s`;

  card.innerHTML = `
    <div class="card-header-bar">
      <span class="card-student-number">${item.number}번</span>
      <span class="card-role-icon" title="${item.role.name}">${item.role.icon || '🌱'}</span>
    </div>
    <div class="card-body">
      <div class="student-name-row">
        <h3 class="student-name">${item.studentName}</h3>
        <span class="student-tag">${isAssigned ? '배정완료' : '준비'}</span>
      </div>
      <div class="role-title-box">
        <span class="role-name">${item.role.name}</span>
      </div>
      <p class="role-description">${item.role.desc || '우리 반을 위해 소중한 책임을 다해요.'}</p>
    </div>
    <div class="card-footer-actions">
      <button class="btn-card-swap" data-index="${index}" title="역할 수동 변경">
        🔄 역할 변경
      </button>
    </div>
  `;

  // 역할 수동 변경 버튼 이벤트
  const swapBtn = card.querySelector('.btn-card-swap');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      openRoleChangeModal(index);
    });
  }

  return card;
}

// 10. 수동 역할 변경 모달 열기
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
    titleEl.textContent = `🌿 ${student.studentName} 학생 (${student.number}번) 역할 변경`;
  }

  if (selectEl) {
    selectEl.innerHTML = '';
    state.roles.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.icon} ${r.name} - ${r.desc.slice(0, 25)}...`;
      if (r.name === currentRoleName) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  modal.setAttribute('data-target-index', studentIndex);
  modal.classList.add('active');
}

// 11. 통계 배지 업데이트
function updateStats() {
  const totalStudentsEl = document.getElementById('statTotalStudents');
  const totalRolesEl = document.getElementById('statTotalRoles');
  const assignedCountEl = document.getElementById('statAssignedCount');

  if (totalStudentsEl) totalStudentsEl.textContent = `${state.students.length}명`;
  if (totalRolesEl) totalRolesEl.textContent = `${state.roles.length}개`;
  if (assignedCountEl) {
    const count = state.assignments.length;
    assignedCountEl.textContent = `${count} / ${state.students.length}명`;
    if (count > 0 && count === state.students.length) {
      assignedCountEl.classList.add('highlight');
    } else {
      assignedCountEl.classList.remove('highlight');
    }
  }
}

// 12. 인쇄용 헤더 동기화
function syncPrintHeader() {
  const printTitle = document.getElementById('printTitle');
  const printClass = document.getElementById('printClass');
  const printDate = document.getElementById('printDate');

  if (printTitle) printTitle.textContent = `🌿 우리 반 1인 1역할 배정 안내판`;
  if (printClass) printClass.textContent = `학급: ${state.className}`;
  if (printDate) printDate.textContent = `배정 일자: ${state.termName}`;
}

// 13. [🖨️ A4 인쇄하기] 기능
function printA4Sheet() {
  playCuteSound('click');
  syncPrintHeader();
  window.print();
}

// 14. [📋 결과 텍스트 복사] 기능 (알림장, 카카오톡 공지용)
function copyResultText() {
  playCuteSound('click');

  if (state.assignments.length === 0) {
    showToast('⚠️ 먼저 [🎲 역할 배정하기] 버튼을 눌러주세요!');
    return;
  }

  let text = `[🌿 ${state.className} 1인 1역할 배정표 (${state.termName})]\n\n`;
  state.assignments.forEach((item) => {
    text += `${item.number}번 ${item.studentName}: ${item.role.icon} ${item.role.name} (${item.role.desc})\n`;
  });
  text += `\n"작은 도토리가 모여 깊은 숲을 이루듯, 모두 함께 즐거운 우리 반을 만들어요!"`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 결과가 복사되었습니다! 알림장에 붙여넣기 하세요.');
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
    showToast('📋 클립보드에 복사되었습니다!');
  } catch (err) {
    showToast('복사에 실패했습니다. 수동으로 복사해 주세요.');
  }
  document.body.removeChild(textArea);
}

// 15. 구글 스프레드시트(Apps Script) 모달 제어 및 API 통신
function openSheetModal(initialTab = 'info') {
  playCuteSound('click');
  const modal = document.getElementById('sheetModal');
  const urlInput = document.getElementById('gasUrlInput');
  if (urlInput) {
    urlInput.value = state.gasUrl || '';
  }
  modal.classList.add('active');
}

// Apps Script에서 명단 불러오기
async function fetchFromSheet() {
  const url = (document.getElementById('gasUrlInput').value || state.gasUrl).trim();
  if (!url) {
    showToast('⚠️ 먼저 구글 Apps Script 웹 앱 URL을 입력해 주세요.');
    return;
  }

  state.gasUrl = url;
  saveToStorage();

  const statusEl = document.getElementById('sheetSyncStatus');
  if (statusEl) {
    statusEl.textContent = '🔄 시트에서 최신 데이터를 가져오는 중...';
    statusEl.style.color = '#265B88';
  }

  try {
    const response = await fetch(`${url}?action=getData`, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`서버 응답 오류 (${response.status})`);
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
        statusEl.textContent = `✅ 성공: 학생 ${data.students.length}명, 역할 ${data.roles ? data.roles.length : 0}개를 시트에서 가져왔습니다!`;
        statusEl.style.color = '#245233';
      }
      showToast('🔄 시트 데이터를 성공적으로 불러왔습니다!');
    } else {
      throw new Error('시트 반환 형식이 올바르지 않습니다.');
    }
  } catch (err) {
    console.warn('Apps Script fetch failed:', err);
    if (statusEl) {
      statusEl.textContent = `ℹ️ 시트 접속 실패 (${err.message}). 안내 탭의 Apps Script 코드가 웹 앱으로 배포되었는지 확인해 주세요.`;
      statusEl.style.color = '#A8382A';
    }
    showToast('⚠️ 시트 통신 오류: 배포 URL 및 권한 설정을 확인해 주세요.');
  }
}

// Apps Script로 현재 배정 결과 전송 및 저장
async function saveToSheet() {
  const url = (document.getElementById('gasUrlInput').value || state.gasUrl).trim();
  if (!url) {
    showToast('⚠️ 먼저 구글 Apps Script 웹 앱 URL을 입력해 주세요.');
    return;
  }

  state.gasUrl = url;
  saveToStorage();

  if (state.assignments.length === 0) {
    showToast('⚠️ 먼저 역할을 배정한 후 저장해 주세요!');
    return;
  }

  const statusEl = document.getElementById('sheetSyncStatus');
  if (statusEl) {
    statusEl.textContent = '💾 시트에 배정 결과를 저장하는 중...';
    statusEl.style.color = '#265B88';
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
      statusEl.textContent = '✅ 구글 시트로 배정 결과가 성공적으로 전송되었습니다!';
      statusEl.style.color = '#245233';
    }
    showToast('💾 시트에 결과 저장을 완료했습니다!');
  } catch (err) {
    console.warn('Apps Script post failed:', err);
    if (statusEl) {
      statusEl.textContent = `❌ 시트 저장 실패: ${err.message}`;
      statusEl.style.color = '#A8382A';
    }
    showToast('⚠️ 시트 저장 중 문제가 발생했습니다.');
  }
}

// 16. 학생 및 역할 관리 모달
function openManageModal() {
  playCuteSound('click');
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
      const descPart = (parts[1] || '성실하게 책임을 다해요.').trim();

      const emojiMatch = titlePart.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji_Presentation})/u);
      let icon = '🌱';
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
  showToast('💾 학생 명단과 역할 목록이 저장되었습니다!');
}

function resetToDefaultData() {
  if (confirm('기본 예시 데이터(학생 12명, 역할 12개)로 초기화하시겠습니까?')) {
    state.students = [...DEFAULT_STUDENTS];
    state.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    state.assignments = [];
    saveToStorage();
    renderCards();
    updateStats();
    syncInputs();
    document.getElementById('manageModal').classList.remove('active');
    showToast('🔄 기본 12명 데이터로 복원되었습니다.');
  }
}

// 17. 인라인 학급명 및 학기 정보 동기화
function syncInputs() {
  const classInput = document.getElementById('classInput');
  const termInput = document.getElementById('termInput');
  if (classInput) classInput.value = state.className;
  if (termInput) termInput.value = state.termName;
}

// 18. 전체 이벤트 리스너 등록
function initEventListeners() {
  // 학급 정보 인라인 수정
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

  // 상단 유틸리티 버튼
  document.getElementById('btnSheetLoad')?.addEventListener('click', () => openSheetModal('load'));
  document.getElementById('btnSheetSave')?.addEventListener('click', () => openSheetModal('save'));
  document.getElementById('btnManage')?.addEventListener('click', openManageModal);
  document.getElementById('btnPrint')?.addEventListener('click', printA4Sheet);

  // 메인 액션 버튼
  document.getElementById('btnAssignMain')?.addEventListener('click', assignRoles);
  document.getElementById('btnReshuffle')?.addEventListener('click', assignRoles);
  document.getElementById('btnCopyResult')?.addEventListener('click', copyResultText);

  // 모달 닫기 버튼들
  document.querySelectorAll('.btn-modal-close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    });
  });

  // 모달 바깥 영역 클릭 시 닫기
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // 역할 수동 변경 확인 버튼
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
        showToast(`🌿 ${state.assignments[index].studentName} 학생의 역할이 변경되었습니다.`);
      }
    }
    modal.classList.remove('active');
  });

  // 시트 모달 내 버튼
  document.getElementById('btnDoFetchSheet')?.addEventListener('click', fetchFromSheet);
  document.getElementById('btnDoSaveSheet')?.addEventListener('click', saveToSheet);
  document.getElementById('btnSaveGasUrl')?.addEventListener('click', () => {
    const url = document.getElementById('gasUrlInput').value.trim();
    state.gasUrl = url;
    saveToStorage();
    showToast('💾 Apps Script URL이 저장되었습니다.');
  });

  // Apps Script 템플릿 코드 복사
  document.getElementById('btnCopyGasCode')?.addEventListener('click', () => {
    const code = document.getElementById('gasCodeSnippet').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        showToast('📋 Apps Script 코드가 복사되었습니다!');
      });
    }
  });

  // 명단 관리 모달 저장 & 리셋
  document.getElementById('btnSaveManage')?.addEventListener('click', saveManagementChanges);
  document.getElementById('btnResetManage')?.addEventListener('click', resetToDefaultData);

  // 모달 내부 탭 전환
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
