let dataStore = [];
let currentIndex = -1;

const TAMIL_MAP = [
    ["aai", "ஆய்"], ["aaw", "ஆவ்"], ["ee", "ஈ"], ["oo", "ஊ"], ["ai", "ஐ"], ["au", "ஔ"],
    ["kaa", "கா"], ["kii", "கீ"], ["koo", "கூ"], ["kai", "கை"], ["kau", "கௌ"],
    ["aa", "ஆ"], ["ii", "ஈ"], ["uu", "ஊ"], ["ea", "ஏ"], ["oa", "ஓ"],
    ["ka", "க"], ["ki", "கி"], ["ku", "கு"], ["ke", "கெ"], ["ko", "கொ"],
    ["a", "அ"], ["i", "இ"], ["u", "உ"], ["e", "எ"], ["o", "ஒ"],
    ["k", "க்"], ["ng", "ங்"], ["ch", "ச்"], ["nj", "ஞ்"], ["t", "ட்"],
    ["th", "த்"], ["p", "ப்"], ["m", "ம்"], ["y", "ய்"], ["r", "ர்"],
    ["l", "ல்"], ["v", "வ்"], ["zh", "ழ்"]
];

const TAMIL_KEYS = {
  vowels: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ஃ'],
  consonants: ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'],
  modifiers: ['ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ', '்']
};

document.addEventListener('DOMContentLoaded', () => {
  renderVirtualKeyboard();
  autoLoad();
});

function autoLoad() {
  fetch('words_for_review.json')
    .then(res => res.json())
    .then(data => {
      loadDataStore(data);
    }).catch(() => {});
}

function loadDataStore(parsedData) {
  const rawList = Array.isArray(parsedData) ? parsedData : [parsedData];
  dataStore = rawList.map((item, idx) => ({
    id: item.id || idx + 1,
    text: item.raw_paragraph || item.paragraph || item.text || "",
    status: item.status || "pending",
    image_url: item.image_url || ""
  }));

  document.getElementById('saveBtn').disabled = false;
  renderSidebar();
  if (dataStore.length > 0) loadSegment(0);
}

window.handleFileSelect = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      loadDataStore(parsed);
    } catch (err) {
      alert("Error reading file: " + err.message);
    }
  };
  reader.readAsText(file);
};

function renderSidebar() {
  const listEl = document.getElementById('pasuramList');
  if (!listEl) return;
  listEl.innerHTML = '';

  let doneCount = 0;
  dataStore.forEach((item, index) => {
    if (item.status === 'done') doneCount++;

    const li = document.createElement('li');
    li.className = `list-group-item ${index === currentIndex ? 'active' : ''}`;
    li.onclick = () => loadSegment(index);

    const title = document.createElement('span');
    title.textContent = `${index + 1}. ${item.text.substring(0, 18)}...`;

    li.appendChild(title);
    listEl.appendChild(li);
  });

  document.getElementById('progressTracker').textContent = `${doneCount}/${dataStore.length} Done`;
}

function loadSegment(index) {
  if (index < 0 || index >= dataStore.length) return;
  saveCurrentEditorState();

  currentIndex = index;
  const item = dataStore[currentIndex];

  document.getElementById('pasuramEditor').value = item.text;
  document.getElementById('currentEditingLabel').textContent = `Editing Segment #${currentIndex + 1}`;
  document.getElementById('pageViewer').src = item.image_url || '';

  document.getElementById('prevBtn').disabled = currentIndex === 0;
  document.getElementById('nextBtn').disabled = currentIndex === dataStore.length - 1;
  document.getElementById('markDoneBtn').disabled = false;
  document.getElementById('markDoneBtn').textContent = item.status === 'done' ? 'Mark Pending' : 'Mark Done';

  renderSidebar();
}

function saveCurrentEditorState() {
  if (currentIndex >= 0 && currentIndex < dataStore.length) {
    dataStore[currentIndex].text = document.getElementById('pasuramEditor').value;
  }
}

window.navigate = function (dir) {
  loadSegment(currentIndex + dir);
};

window.toggleDoneState = function () {
  if (currentIndex < 0) return;
  dataStore[currentIndex].status = dataStore[currentIndex].status === 'done' ? 'pending' : 'done';
  loadSegment(currentIndex);
};

window.handleTransliterationKeyDown = function (event) {
  if (event.key === ' ' || event.key === 'Enter') {
    const editor = event.target;
    const pos = editor.selectionStart;
    const before = editor.value.substring(0, pos);
    const after = editor.value.substring(pos);

    const words = before.split(/(\s+)/);
    if (words.length > 0) {
      const idx = words.length - 2;
      if (idx >= 0 && /^[a-zA-Z]+$/.test(words[idx])) {
        let t = words[idx].toLowerCase();
        for (let [eng, tam] of TAMIL_MAP) {
          t = t.replace(new RegExp(eng, 'g'), tam);
        }
        words[idx] = t;
        editor.value = words.join('') + after;
        editor.selectionStart = editor.selectionEnd = pos;
      }
    }
  }
};

window.insertAtCursor = function (text) {
  const editor = document.getElementById('pasuramEditor');
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
  editor.setSelectionRange(start + text.length, start + text.length);
  editor.focus();
};

function renderVirtualKeyboard() {
  const renderRow = (id, keys) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key';
      btn.textContent = k;
      btn.onclick = () => insertAtCursor(k);
      el.appendChild(btn);
    });
  };

  renderRow('vowelsRow', TAMIL_KEYS.vowels);
  renderRow('consonantsRow', TAMIL_KEYS.consonants);
  renderRow('modifiersRow', TAMIL_KEYS.modifiers);
}

window.saveFile = function () {
  saveCurrentEditorState();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataStore, null, 2));
  const anchor = document.createElement('a');
  anchor.setAttribute("href", dataStr);
  anchor.setAttribute("download", "replacements.json");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};