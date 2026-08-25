/**
 * Tamil OCR Proofreader Engine - Integrated Application Logic
 * Features: Book/Page Selectors, Virtual Keyboard, Phonetic Transliteration, Side-by-Side Image Sync, State Tracking
 */

let dataStore = [];
let currentIndex = -1;

// Phonetic Transliteration Mapping Table
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

// Virtual Keyboard Character Layouts
const TAMIL_KEYS = {
  vowels: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ஃ'],
  consonants: ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'],
  modifiers: ['ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ', '்']
};

document.addEventListener('DOMContentLoaded', () => {
  renderVirtualKeyboard();
  autoLoad();
});

/**
 * Attempts to auto-load root queue if available
 */
function autoLoad() {
  fetch('words_for_review.json')
    .then(res => res.json())
    .then(data => {
      loadDataStore(data);
    }).catch(() => {});
}

/**
 * Normalizes raw JSON input into the internal application state
 */
function loadDataStore(parsedData) {
  const rawList = Array.isArray(parsedData) ? parsedData : [parsedData];
  dataStore = rawList.map((item, idx) => ({
    id: item.id || idx + 1,
    text: item.raw_paragraph || item.paragraph || item.text || "",
    word: item.word || "",
    status: item.status || "pending",
    image_url: item.page_image || item.image_url || ""
  }));

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.disabled = false;

  renderSidebar();
  if (dataStore.length > 0) loadSegment(0);
}

/**
 * Handles manual JSON file uploads
 */
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

/**
 * Dynamic Book -> Page Queue Loaders
 */
window.loadBookPages = function () {
    const book = document.getElementById('bookSelect').value;
    const pageSelect = document.getElementById('pageSelect');
    if (!pageSelect) return;

    pageSelect.innerHTML = '<option value="">-- Choose Page --</option>';
    if (!book) return;

    for (let i = 1; i <= 300; i++) {
        const opt = document.createElement('option');
        opt.value = `review_queue/${book}/page_${i}.json`;
        opt.textContent = `Page ${i}`;
        pageSelect.appendChild(opt);
    }
};

window.loadPageData = async function () {
    const pageJsonPath = document.getElementById('pageSelect').value;
    if (!pageJsonPath) return;

    try {
        const response = await fetch(pageJsonPath);
        if (response.ok) {
            const data = await response.json();
            loadDataStore(data);
        } else {
            alert("No review flags found for this page!");
            dataStore = [];
            renderSidebar();
        }
    } catch (e) {
        console.error("Error loading page data:", e);
    }
};

/**
 * Sidebar Tracker & Segment List Renderer
 */
function renderSidebar() {
  const listEl = document.getElementById('pasuramList');
  if (!listEl) return;
  listEl.innerHTML = '';

  let doneCount = 0;
  dataStore.forEach((item, index) => {
    if (item.status === 'done') doneCount++;

    const li = document.createElement('li');
    li.className = `list-group-item ${index === currentIndex ? 'active' : ''}`;
    li.style.padding = "8px";
    li.style.borderBottom = "1px solid #eee";
    li.style.cursor = "pointer";
    if (index === currentIndex) li.style.background = "#e9ecef";

    li.onclick = () => loadSegment(index);

    const title = document.createElement('span');
    const labelText = item.word ? `[${item.word}]` : item.text.substring(0, 18);
    title.textContent = `${index + 1}. ${labelText}...`;

    if (item.status === 'done') {
      title.style.textDecoration = "line-through";
      title.style.color = "#888";
    }

    li.appendChild(title);
    listEl.appendChild(li);
  });

  const tracker = document.getElementById('progressTracker');
  if (tracker) tracker.textContent = `${doneCount}/${dataStore.length} Done`;
}

/**
 * Loads targeted segment into the main editor panel & updates PDF image
 */
function loadSegment(index) {
  if (index < 0 || index >= dataStore.length) return;
  saveCurrentEditorState();

  currentIndex = index;
  const item = dataStore[currentIndex];

  const editor = document.getElementById('pasuramEditor');
  if (editor) editor.value = item.text;

  const label = document.getElementById('currentEditingLabel');
  if (label) label.textContent = `Editing Segment #${currentIndex + 1} ${item.word ? '(' + item.word + ')' : ''}`;

  const viewer = document.getElementById('pageViewer');
  if (viewer && item.image_url) viewer.src = item.image_url;

  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.disabled = currentIndex === 0;

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.disabled = currentIndex === dataStore.length - 1;

  const doneBtn = document.getElementById('markDoneBtn');
  if (doneBtn) {
    doneBtn.disabled = false;
    doneBtn.textContent = item.status === 'done' ? 'Mark Pending' : 'Mark Done';
  }

  renderSidebar();
}

/**
 * Saves current textarea content into state array before navigating
 */
function saveCurrentEditorState() {
  if (currentIndex >= 0 && currentIndex < dataStore.length) {
    const editor = document.getElementById('pasuramEditor');
    if (editor) dataStore[currentIndex].text = editor.value;
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

/**
 * Live Transliteration on Keypress (Space / Enter)
 */
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

/**
 * Inserts characters directly at the current cursor position
 */
window.insertAtCursor = function (text) {
  const editor = document.getElementById('pasuramEditor');
  if (!editor) return;

  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
  editor.setSelectionRange(start + text.length, start + text.length);
  editor.focus();
};

/**
 * Renders the virtual key buttons in the virtual keyboard container
 */
function renderVirtualKeyboard() {
  const renderRow = (id, keys) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key';
      btn.textContent = k;
      btn.style.margin = "2px";
      btn.style.padding = "5px 8px";
      btn.style.cursor = "pointer";
      btn.onclick = () => insertAtCursor(k);
      el.appendChild(btn);
    });
  };

  renderRow('vowelsRow', TAMIL_KEYS.vowels);
  renderRow('consonantsRow', TAMIL_KEYS.consonants);
  renderRow('modifiersRow', TAMIL_KEYS.modifiers);
}

/**
 * Exports current modifications as replacements.json
 */
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