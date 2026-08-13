/**
 * Paragraph-Level Tamil OCR Proofreading Tool - Application Logic
 * Fixed Transliteration Engine (Space, Enter, & Live Conversion)
 */

let reviewData = [];
let replacements = {};
let activeTextareaId = null;
let currentBookFilter = "ALL";

// Comprehensive Phonetic Transliteration Map (Ordered by length descending)
const TAMIL_MAP = [
    ["aai", "ஆய்"], ["aaw", "ஆவ்"], ["ee", "ஈ"], ["oo", "ஊ"], ["ai", "ஐ"], ["au", "ஔ"],
    ["kaa", "கா"], ["kii", "கீ"], ["koo", "கூ"], ["kai", "கை"], ["kau", "கௌ"],
    ["ngaa", "ஙா"], ["ngii", "ஙீ"], ["ngoo", "ஙூ"], ["ngai", "ஙை"], ["ngau", "ஙௌ"],
    ["chaa", "சா"], ["chii", "சீ"], ["choo", "சூ"], ["chai", "சை"], ["chau", "சௌ"],
    ["njaa", "ஞா"], ["njii", "ஞீ"], ["njoo", "ஞூ"], ["njai", "ஞை"], ["njau", "ஞௌ"],
    ["taa", "டா"], ["tii", "டீ"], ["too", "டூ"], ["tai", "டை"], ["tau", "டௌ"],
    ["naa", "ணா"], ["nii", "ணீ"], ["noo", "ணூ"], ["nai", "ணை"], ["nau", "ணௌ"],
    ["thaa", "தா"], ["thii", "தீ"], ["thoo", "தூ"], ["thai", "தை"], ["thau", "தௌ"],
    ["paa", "பா"], ["pii", "பீ"], ["poo", "பூ"], ["pai", "பை"], ["pau", "பௌ"],
    ["maa", "மா"], ["mii", "மீ"], ["moo", "மூ"], ["mai", "மை"], ["mau", "மௌ"],
    ["yaa", "யா"], ["yii", "யீ"], ["yoo", "யூ"], ["yai", "யை"], ["yau", "யௌ"],
    ["raa", "ரா"], ["rii", "ரீ"], ["roo", "ரூ"], ["rai", "ரை"], ["rau", "ரௌ"],
    ["laa", "லா"], ["lii", "லீ"], ["loo", "லூ"], ["lai", "லை"], ["lau", "லௌ"],
    ["vaa", "வா"], ["vii", "வீ"], ["voo", "வூ"], ["vai", "வை"], ["vau", "வௌ"],
    ["zhaa", "ழா"], ["zhii", "ழீ"], ["zhoo", "ழூ"], ["zhai", "ழை"], ["zhau", "ழௌ"],
    ["aa", "ஆ"], ["ii", "ஈ"], ["uu", "ஊ"], ["ea", "ஏ"], ["oa", "ஓ"],
    ["ka", "க"], ["ki", "கி"], ["ku", "கு"], ["ke", "கெ"], ["ko", "கொ"],
    ["nga", "ங"], ["ngi", "ஙி"], ["ngu", "ஙு"], ["nge", "ஙெ"], ["ngo", "ஙொ"],
    ["cha", "ச"], ["chi", "சி"], ["chu", "சு"], ["che", "செ"], ["cho", "சொ"],
    ["nja", "ஞ"], ["nji", "ஞி"], ["nju", "ஞு"], ["nje", "ஞெ"], ["njo", "ஞொ"],
    ["ta", "ட"], ["ti", "டி"], ["tu", "டு"], ["te", "டெ"], ["to", "டொ"],
    ["na", "ண"], ["ni", "ணி"], ["nu", "ணு"], ["ne", "ணெ"], ["no", "ணொ"],
    ["tha", "த"], ["thi", "தி"], ["thu", "து"], ["the", "தெ"], ["tho", "தொ"],
    ["pa", "ப"], ["pi", "பி"], ["pu", "பு"], ["pe", "பெ"], ["po", "பொ"],
    ["ma", "ம"], ["mi", "மி"], ["mu", "மு"], ["me", "மெ"], ["mo", "மொ"],
    ["ya", "ய"], ["yi", "யி"], ["yu", "யு"], ["ye", "யெ"], ["yo", "யொ"],
    ["ra", "ர"], ["ri", "ரி"], ["ru", "ரு"], ["re", "ரெ"], ["ro", "ரொ"],
    ["la", "ல"], ["li", "லி"], ["lu", "லு"], ["le", "லெ"], ["lo", "லொ"],
    ["va", "வ"], ["vi", "வி"], ["vu", "வு"], ["ve", "வெ"], ["vo", "வொ"],
    ["zha", "ழ"], ["zhi", "ழி"], ["zhu", "ழு"], ["zhe", "ழெ"], ["zho", "ழொ"],
    ["a", "அ"], ["i", "இ"], ["u", "உ"], ["e", "எ"], ["o", "ஒ"],
    ["k", "க்"], ["ng", "ங்"], ["ch", "ச்"], ["nj", "ஞ்"], ["t", "ட்"],
    ["th", "த்"], ["p", "ப்"], ["m", "ம்"], ["y", "ய்"], ["r", "ர்"],
    ["l", "ல்"], ["v", "வ்"], ["zh", "ழ்"]
];

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        parseAndLoadJSON(evt.target.result);
    };
    reader.onerror = function () {
        alert("Error reading file!");
    };
    reader.readAsText(file);
}

function loadPastedJSON() {
    const rawText = document.getElementById('jsonPasteArea').value.trim();
    if (!rawText) {
        alert("Please paste JSON content first!");
        return;
    }
    parseAndLoadJSON(rawText);
}

function parseAndLoadJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed)) {
            alert("JSON format error: Expected a list/array of items `[...]`.");
            return;
        }
        reviewData = parsed;
        populateBookSelector();
        renderCards();
    } catch (err) {
        alert("Invalid JSON structure! " + err.message);
    }
}

function populateBookSelector() {
    const filterSection = document.getElementById('filterSection');
    const bookSelect = document.getElementById('bookSelect');
    if (!filterSection || !bookSelect) return;

    const books = new Set();
    reviewData.forEach(item => {
        const fileName = item.file || item.filename || item.source_file || 'Unknown Book';
        books.add(fileName);
    });

    bookSelect.innerHTML = '<option value="ALL">Show All Books (' + reviewData.length + ' items)</option>';
    books.forEach(book => {
        const count = reviewData.filter(i => (i.file || i.filename || i.source_file || 'Unknown Book') === book).length;
        const opt = document.createElement('option');
        opt.value = book;
        opt.textContent = `${book} (${count} items)`;
        bookSelect.appendChild(opt);
    });

    filterSection.style.display = 'flex';
}

function filterByBook() {
    const bookSelect = document.getElementById('bookSelect');
    currentBookFilter = bookSelect ? bookSelect.value : 'ALL';
    renderCards();
}

function renderCards() {
    const container = document.getElementById('reviewContainer');
    if (!container) return;

    container.innerHTML = '';

    const filteredData = currentBookFilter === 'ALL'
        ? reviewData
        : reviewData.filter(item => (item.file || item.filename || item.source_file || 'Unknown Book') === currentBookFilter);

    if (!Array.isArray(filteredData) || filteredData.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px; color: #666; font-size:1.1em;">No pending items for review!</p>';
        return;
    }

    filteredData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${index}`;

        const bookName = item.file || item.filename || item.source_file || 'Unknown';
        const flaggedWord = item.word || item.flagged_word || 'N/A';
        const previewPara = item.paragraph || item.context_paragraph || item.raw_paragraph || '';
        const editablePara = item.raw_paragraph || item.paragraph || '';

        card.innerHTML = `
            <div class="card-header">
                <span><strong>Book / File:</strong> ${escapeHtml(bookName)}</span>
                <span>Flagged Word: <span class="flagged-word-badge">${escapeHtml(flaggedWord)}</span></span>
            </div>
            
            <label>Context Paragraph (Flagged Word Highlighted):</label>
            <div class="paragraph-preview">${previewPara}</div>

            <label>Correct Paragraph In-Place (Type in English + Press Space to Transliterate):</label>
            <textarea 
                id="edit-para-${index}" 
                class="editable-paragraph" 
                onkeydown="handleTransliterationKeyDown(event)"
                onfocus="activeTextareaId='edit-para-${index}'"
            >${escapeHtml(editablePara)}</textarea>

            <div class="actions">
                <button class="btn btn-save" onclick="saveCorrection(${index}, '${escapeHtml(flaggedWord)}')">Save Correction</button>
                <button class="btn btn-skip" onclick="skipItem(${index})">Ignore / Keep Original</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function transliterateWord(input) {
    let text = input.toLowerCase();
    for (let [eng, tam] of TAMIL_MAP) {
        const regex = new RegExp(eng, 'g');
        text = text.replace(regex, tam);
    }
    return text;
}

/**
 * Enhanced KeyDown Transliteration Handler
 * Converts the last English word immediately when Spacebar, Enter, or Tab is pressed.
 */
function handleTransliterationKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Tab') {
        const textarea = event.target;
        const cursorPosition = textarea.selectionStart;

        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        const textAfterCursor = textarea.value.substring(cursorPosition);

        // Match the last active word before cursor containing English characters
        const match = textBeforeCursor.match(/([a-zA-Z]+)$/);

        if (match) {
            const englishWord = match[1];
            const tamilWord = transliterateWord(englishWord);

            const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.length - englishWord.length) + tamilWord;

            textarea.value = newTextBefore + textAfterCursor;

            // Restore correct cursor offset
            const newCursorPos = newTextBefore.length;
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }
    }
}

function saveCorrection(index, originalWord) {
    const textarea = document.getElementById(`edit-para-${index}`);
    if (!textarea) return;

    const updatedParagraph = textarea.value;
    const item = reviewData[index] || {};

    replacements[originalWord] = {
        file: item.file || item.filename || item.source_file || "Unknown",
        original_paragraph: item.raw_paragraph || item.paragraph || "",
        corrected_paragraph: updatedParagraph
    };

    const cardElement = document.getElementById(`card-${index}`);
    if (cardElement) {
        cardElement.style.display = 'none';
    }
}

function skipItem(index) {
    const cardElement = document.getElementById(`card-${index}`);
    if (cardElement) {
        cardElement.style.display = 'none';
    }
}

function exportReplacements() {
    if (Object.keys(replacements).length === 0) {
        alert("No corrections made yet!");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(replacements, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "replacements.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}



let currentInputBuffer = "";
let suggestions = [];
let selectedIndex = 0;
let activeElement = null;

// Google Input Tools Transliteration API Fetcher
async function fetchTamilTransliteration(text) {
    if (!text.trim()) return [];
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ta-t-i0-und&num=5`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data[0] === "SUCCESS") {
            return data[1][0][1]; // Array of transliterated candidates
        }
    } catch (err) {
        console.error("Transliteration error:", err);
    }
    return [];
}

// Attach listener to editable elements
function setupTransliteration(element) {
    element.addEventListener('keydown', async (e) => {
        const translitBar = document.getElementById('translit-bar');

        if (e.key >= 'a' && e.key <= 'z' || e.key >= 'A' && e.key <= 'Z') {
            currentInputBuffer += e.key;
            await updateSuggestions(element);
        } else if (e.key === 'Backspace' && currentInputBuffer.length > 0) {
            currentInputBuffer = currentInputBuffer.slice(0, -1);
            if (currentInputBuffer.length > 0) {
                await updateSuggestions(element);
            } else {
                hideTranslitBar();
            }
        } else if ((e.key === ' ' || e.key === 'Enter') && currentInputBuffer.length > 0) {
            e.preventDefault(); // Stop raw space insert
            commitSuggestion(element, suggestions[selectedIndex] || currentInputBuffer);
            if (e.key === ' ') insertTextAtCursor(element, ' ');
            hideTranslitBar();
        } else if (e.key === 'ArrowRight' && suggestions.length > 0) {
            selectedIndex = (selectedIndex + 1) % suggestions.length;
            renderSuggestions();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' && suggestions.length > 0) {
            selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
            renderSuggestions();
            e.preventDefault();
        }
    });
}

async function updateSuggestions(element) {
    suggestions = await fetchTamilTransliteration(currentInputBuffer);
    if (suggestions.length > 0) {
        selectedIndex = 0;
        showTranslitBar(element);
        renderSuggestions();
    } else {
        hideTranslitBar();
    }
}

function showTranslitBar(element) {
    const translitBar = document.getElementById('translit-bar');
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    translitBar.style.top = `${window.scrollY + rect.top - 40}px`;
    translitBar.style.left = `${window.scrollX + rect.left}px`;
    translitBar.style.display = 'block';
}

function hideTranslitBar() {
    const translitBar = document.getElementById('translit-bar');
    translitBar.style.display = 'none';
    currentInputBuffer = "";
    suggestions = [];
}

function renderSuggestions() {
    const translitBar = document.getElementById('translit-bar');
    translitBar.innerHTML = suggestions.map((s, i) =>
        `<span class="translit-option ${i === selectedIndex ? 'active' : ''}" onclick="selectCandidate('${s}')">${i + 1}. ${s}</span>`
    ).join('');
}

function commitSuggestion(element, tamilText) {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // Replace buffer english characters with converted Tamil text
        for (let i = 0; i < currentInputBuffer.length; i++) {
            document.execCommand('delete', false, null);
        }
        document.execCommand('insertText', false, tamilText);
    }
}

function insertTextAtCursor(element, text) {
    document.execCommand('insertText', false, text);
}