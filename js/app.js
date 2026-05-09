let dialogues = {};
let currentDialogue = null;
let audio = new Audio();
let currentSegIndex = 0;
let viewMode = 'transcription'; // 'clean', 'transcription', 'translation'

async function init() {
  const resp = await fetch('data/dialogues.json');
  dialogues = await resp.json();
  renderList();
  setupNav();
}

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(btn.dataset.page).classList.add('active');
    });
  });
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === id);
  });
}

// === DIALOGUE LIST ===
function renderList() {
  const container = document.getElementById('dialogueList');
  const series = { A: [], B: [], C: [] };
  for (const [k, d] of Object.entries(dialogues)) {
    series[d.series].push(d);
  }

  let html = '';
  const seriesNames = {
    A: 'Серия A — GENKI I',
    B: 'Серия B — Beginning Japanese',
    C: 'Серия C — Другие источники'
  };

  for (const [s, items] of Object.entries(series)) {
    if (!items.length) continue;
    html += `<div class="series-header">${seriesNames[s]}</div>`;
    for (const d of items) {
      const lineCount = d.lines ? d.lines.length : 0;
      const hasText = lineCount > 0;
      html += `
        <div class="dialogue-card" onclick="openDialogue('${d.id}')">
          <span class="id">${d.id}</span>
          <div class="info">
            <div class="title">${d.title || d.id}</div>
            <div class="meta">${d.lesson || ''} ${d.dialogueNum ? '/ ' + d.dialogueNum : ''} ${d.source || ''}</div>
          </div>
          <span class="audio-count">${d.audioFiles.length} audio${hasText ? '' : ' (img)'}</span>
        </div>`;
    }
  }
  container.innerHTML = html;
}

// === OPEN DIALOGUE ===
function openDialogue(id) {
  currentDialogue = dialogues[id];
  currentSegIndex = 0;
  audio.pause();
  audio.currentTime = 0;

  document.getElementById('playerTitle').textContent = currentDialogue.title || id;
  document.getElementById('playerSubtitle').textContent =
    `${currentDialogue.source || ''} ${currentDialogue.lesson || ''} ${currentDialogue.dialogueNum ? '(' + currentDialogue.dialogueNum + ')' : ''}`;

  renderSegmentButtons();
  renderLines();
  setMode(viewMode);
  loadSegment(0);
  showPage('playerPage');
}

function goBack() {
  audio.pause();
  showPage('listPage');
}

// === SEGMENT BUTTONS ===
function renderSegmentButtons() {
  const row = document.getElementById('segmentRow');
  const files = currentDialogue.audioFiles;
  let html = '';
  for (let i = 0; i < files.length; i++) {
    const name = files[i].replace('.mp3', '');
    const isMain = !name.includes('-');
    const label = isMain ? 'Full' : name.split('-').pop();
    html += `<button class="seg-btn${i === 0 ? ' active' : ''}" onclick="loadSegment(${i})">${label}</button>`;
  }
  row.innerHTML = html;
}

function loadSegment(idx) {
  currentSegIndex = idx;
  const file = currentDialogue.audioFiles[idx];
  audio.src = `assets/audio/${currentDialogue.id}/${file}`;
  audio.load();

  document.querySelectorAll('.seg-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });

  // Highlight corresponding line
  highlightLine(idx);
}

// === AUDIO CONTROLS ===
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const timeDisplay = document.getElementById('timeDisplay');

function togglePlay() {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = '⏸';
  } else {
    audio.pause();
    playBtn.textContent = '▶';
  }
}

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    timeDisplay.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
  }
});

audio.addEventListener('ended', () => {
  playBtn.textContent = '▶';
  // Auto-advance to next segment
  if (currentSegIndex < currentDialogue.audioFiles.length - 1) {
    loadSegment(currentSegIndex + 1);
    audio.play();
    playBtn.textContent = '⏸';
  }
});

audio.addEventListener('play', () => { playBtn.textContent = '⏸'; });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });

function seekAudio() {
  if (audio.duration) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// === LINES RENDERING ===
function renderLines() {
  const container = document.getElementById('linesContainer');
  const d = currentDialogue;

  if (!d.lines || d.lines.length === 0) {
    // Fallback to images
    if (d.translationImages && d.translationImages.length) {
      let html = '<div class="translation-images">';
      for (const img of d.translationImages) {
        html += `<img src="assets/pdf-images/${img}" alt="${d.id}">`;
      }
      html += '</div>';
      container.innerHTML = html;
    } else {
      container.innerHTML = '<p style="color:var(--text2);text-align:center;padding:40px">Текст диалога не доступен. Используйте аудио.</p>';
    }
    return;
  }

  let html = '';
  for (let i = 0; i < d.lines.length; i++) {
    const line = d.lines[i];
    html += `
      <div class="line-row" data-idx="${i}" onclick="playLineSegment(${i})">
        ${line.speaker ? `<div class="line-speaker">${line.speaker}</div>` : ''}
        <div class="line-jp ${viewMode === 'clean' ? '' : ''}">${line.jp || ''}</div>
        <div class="line-romaji">${line.romaji || ''}</div>
        <div class="line-en">${line.en || ''}</div>
        <div class="line-ru">${line.ru || ''}</div>
      </div>`;
  }
  container.innerHTML = html;
  applyMode();
}

function playLineSegment(lineIdx) {
  // Try to find matching audio segment (line index + 1 because index 0 is usually "Full")
  const segIdx = lineIdx + 1;
  if (segIdx < currentDialogue.audioFiles.length) {
    loadSegment(segIdx);
    audio.play();
  }
}

function highlightLine(segIdx) {
  document.querySelectorAll('.line-row').forEach(r => r.classList.remove('highlight'));
  // segIdx 0 = full, 1 = line 0, 2 = line 1, etc.
  const lineIdx = segIdx - 1;
  const row = document.querySelector(`.line-row[data-idx="${lineIdx}"]`);
  if (row) {
    row.classList.add('highlight');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// === VIEW MODES ===
function setMode(mode) {
  viewMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  applyMode();
}

function applyMode() {
  const lines = document.querySelectorAll('.line-row');
  lines.forEach(row => {
    const jp = row.querySelector('.line-jp');
    const romaji = row.querySelector('.line-romaji');
    const en = row.querySelector('.line-en');
    const ru = row.querySelector('.line-ru');
    if (!jp) return;

    switch (viewMode) {
      case 'clean':
        jp.classList.add('hidden');
        romaji.classList.add('hidden');
        en.classList.add('hidden');
        ru.classList.add('hidden');
        break;
      case 'transcription':
        jp.classList.remove('hidden');
        romaji.classList.remove('hidden');
        en.classList.add('hidden');
        ru.classList.add('hidden');
        break;
      case 'translation':
        jp.classList.remove('hidden');
        romaji.classList.remove('hidden');
        en.classList.add('hidden');
        ru.classList.remove('hidden');
        break;
    }
  });
}

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && document.getElementById('playerPage').classList.contains('active')) {
    e.preventDefault();
    togglePlay();
  }
  if (e.code === 'ArrowRight' && currentDialogue) {
    if (currentSegIndex < currentDialogue.audioFiles.length - 1) loadSegment(currentSegIndex + 1);
  }
  if (e.code === 'ArrowLeft' && currentDialogue) {
    if (currentSegIndex > 0) loadSegment(currentSegIndex - 1);
  }
});

document.addEventListener('DOMContentLoaded', init);
