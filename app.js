/**
 * Tamil Digitization - Dynamic Multi-Book Engine
 * Image Path Target: output_texts/<book>/images/page-<num>.png
 */

let AVAILABLE_BOOKS = [];
let currentBook = "";
let currentPage = 1;

const editor = document.getElementById('textEditor');
const pageImg = document.getElementById('pageViewer');

// Storage keys per book
const getStorageKeyText = (book) => `tamil_ocr_text_${book}`;
const getStorageKeyScroll = (book) => `tamil_ocr_scroll_${book}`;
const getStorageKeyPage = (book) => `tamil_ocr_page_${book}`;

// Transliteration Dictionary
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
    ["laa", "ளா"], ["lii", "ளீ"], ["loo", "ளூ"], ["lai", "ளை"], ["lau", "ளௌ"],
    

    ["aa", "ஆ"], ["ii", "ஈ"], ["uu", "ஊ"], ["ea", "ஏ"], ["oa", "ஓ"],
    ["ka", "க"], ["ki", "கி"], ["ku", "கு"], ["ke", "கெ"], ["ko", "கொ"],
    ["nga", "ங"], ["ngi", "ஙி"], ["ngu", "ஙு"], ["nge", "ஙெ"], ["ngo", "ஙொ"],
    ["cha", "ச"], ["chi", "சி"], ["chu", "சு"], ["che", "செ"], ["cho", "சொ"],
    ["nja", "ஞ"], ["nji", "ஞி"], ["nju", "ஞு"], ["nje", "ஞெ"], ["njo", "ஞொ"],
    ["ta", "ட"], ["ti", "டி"], ["tu", "டு"], ["te", "டெ"], ["to", "டொ"],
    ["na", "ண"], ["ni", "ணி"], ["nu", "ணு"], ["ne", "ணெ"], ["no", "ணொ"],
    ["tha", "த"], ["thi", "தி"], ["thu", "து"], ["the", "தெ"], ["tho", "தொ"],
    ["pa", "ப"], ["pi", "பி"], ["pu", "பு"], ["pe", "பெ"], ["po", "பொ"],
    ["ma", "ம"], ["mi", "மி"], ["mu", "மூ"], ["me", "மெ"], ["mo", "மொ"],
    ["ya", "ய"], ["yi", "யி"], ["yu", "யு"], ["ye", "யெ"], ["yo", "யொ"],
    ["ra", "ர"], ["ri", "ரி"], ["ru", "ரு"], ["re", "ரெ"], ["ro", "ரொ"],
    ["la", "ல"], ["li", "லி"], ["lu", "லு"], ["le", "லெ"], ["lo", "லொ"],
    ["va", "வ"], ["vi", "வி"], ["vu", "வு"], ["ve", "வெ"], ["vo", "வொ"],
    ["zha", "ழ"], ["zhi", "ழி"], ["zhu", "ழு"], ["zhe", "ழெ"], ["zho", "ழொ"],
    ["ja", "ஜ"], ["ji", "ஜி"], ["ju", "ஜு"], ["ha", "ஹ"], ["hi", "ஹி"], ["hu", "ஹு"],

    ["a", "அ"], ["i", "இ"], ["u", "உ"], ["e", "எ"], ["o", "ஒ"],
    ["k", "க்"], ["ng", "ங்"], ["ch", "ச்"], ["nj", "ஞ்"], ["t", "ட்"],
    ["th", "த்"], ["p", "ப்"], ["m", "ம்"], ["y", "ய்"], ["r", "ர்"],
    ["l", "ல்"], ["v", "வ்"], ["zh", "ழ்"], ["j", "ஜ்"], ["h", "ஹ்"], ["s", "ஸ்"]
];

// Entry Point Initialization
document.addEventListener('DOMContentLoaded', async () => {
    buildVirtualKeyboard();
    await loadBookManifest();
});

async function loadBookManifest() {
    try {
        const res = await fetch('output_texts/manifest.json');
        if (!res.ok) throw new Error("Could not fetch manifest.json");

        AVAILABLE_BOOKS = await res.json();

        if (Array.isArray(AVAILABLE_BOOKS) && AVAILABLE_BOOKS.length > 0) {
            populateBookDropdown();

            // Set currentBook from saved history or default to the first entry in manifest
            const savedBook = localStorage.getItem("last_selected_book");
            if (savedBook && AVAILABLE_BOOKS.includes(savedBook)) {
                currentBook = savedBook;
            } else {
                currentBook = AVAILABLE_BOOKS[0];
            }

            document.getElementById('bookSelect').value = currentBook;
            loadBook(currentBook);
        }
    } catch (e) {
        console.warn("Could not load dynamic manifest, defaulting to empty list.", e);
    }
}

function populateBookDropdown() {
    const select = document.getElementById('bookSelect');
    if (select) {
        select.innerHTML = AVAILABLE_BOOKS.map(b => `<option value="${b}">${b}</option>`).join('');
    }
}

function switchBook(bookId) {
    if (!bookId) return;
    currentBook = bookId;
    localStorage.setItem("last_selected_book", bookId);
    loadBook(bookId);
}

function loadBook(bookId) {
    if (!bookId) return;
    document.getElementById('currentBookLabel').textContent = bookId;

    const savedPage = localStorage.getItem(getStorageKeyPage(bookId));
    currentPage = savedPage ? parseInt(savedPage) : 1;
    loadPageImage(currentPage);

    const savedText = localStorage.getItem(getStorageKeyText(bookId));
    if (savedText !== null) {
        editor.value = savedText;
        restoreScroll(bookId);
    } else {
        const textFilePath = `output_texts/${bookId}/${bookId}.txt`;
        fetch(textFilePath)
            .then(res => {
                if (!res.ok) throw new Error("Could not fetch text file automatically");
                return res.text();
            })
            .then(text => {
                editor.value = text;
                localStorage.setItem(getStorageKeyText(bookId), text);
                editor.scrollTop = 0;
            })
            .catch(() => {
                editor.value = "";
            });
    }
}

function restoreScroll(bookId) {
    const savedScrollTop = localStorage.getItem(getStorageKeyScroll(bookId));
    if (savedScrollTop !== null) {
        setTimeout(() => {
            editor.scrollTop = parseInt(savedScrollTop);
        }, 100);
    }
}

function loadPageImage(pageNum) {
    if (!currentBook) return;

    // Try common zero-padded formats dynamically: 4-digit, 3-digit, 2-digit, and raw number
    const padded4 = String(pageNum).padStart(4, '0'); // page-0001.png
    const padded3 = String(pageNum).padStart(3, '0'); // page-001.png
    const padded2 = String(pageNum).padStart(2, '0'); // page-01.png
    const rawNum = String(pageNum);                  // page-1.png

    const basePath = `output_texts/${currentBook}/images`;
    const imgElement = pageImg;

    // Helper to test multiple path variations sequentially
    const tryLoadImage = (paths) => {
        if (paths.length === 0) return;
        const currentPath = paths.shift();

        const testImg = new Image();
        testImg.onload = () => {
            imgElement.src = currentPath;
        };
        testImg.onerror = () => {
            // Try next path candidate if loading fails
            tryLoadImage(paths);
        };
        testImg.src = currentPath;
    };

    tryLoadImage([
        `${basePath}/page-${padded3}.png`,
        `${basePath}/page-${padded4}.png`,
        `${basePath}/page-${padded2}.png`,
        `${basePath}/page-${rawNum}.png`
    ]);

    document.getElementById('pageNumInput').value = pageNum;
    localStorage.setItem(getStorageKeyPage(currentBook), pageNum);
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1) {
        currentPage = newPage;
        loadPageImage(currentPage);
    }
}

function goToPage(val) {
    const pageNum = parseInt(val);
    if (pageNum >= 1) {
        currentPage = pageNum;
        loadPageImage(currentPage);
    }
}

// --- Text Persistence & Auto Save ---
editor.addEventListener('input', () => {
    if (currentBook) {
        localStorage.setItem(getStorageKeyText(currentBook), editor.value);
    }
});

editor.addEventListener('scroll', () => {
    if (currentBook) {
        localStorage.setItem(getStorageKeyScroll(currentBook), editor.scrollTop);
    }
});

editor.addEventListener('keyup', updatePosIndicator);
editor.addEventListener('click', updatePosIndicator);

function updatePosIndicator() {
    const textLines = editor.value.substr(0, editor.selectionStart).split("\n");
    const line = textLines.length;
    const col = textLines[textLines.length - 1].length + 1;
    document.getElementById('posIndicator').textContent = `Line: ${line} | Col: ${col}`;
}

document.getElementById('txtFileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        editor.value = evt.target.result;
        if (currentBook) {
            localStorage.setItem(getStorageKeyText(currentBook), editor.value);
            editor.scrollTop = 0;
            localStorage.setItem(getStorageKeyScroll(currentBook), 0);
        }
    };
    reader.readAsText(file);
});

function clearCurrentBookProgress() {
    if (!currentBook) return;
    if (confirm(`Reset saved edits, page number, and scroll position for '${currentBook}'?`)) {
        localStorage.removeItem(getStorageKeyText(currentBook));
        localStorage.removeItem(getStorageKeyScroll(currentBook));
        localStorage.removeItem(getStorageKeyPage(currentBook));
        loadBook(currentBook);
    }
}

function exportText() {
    const textContent = editor.value;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${currentBook || 'book'}_corrected.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// --- Transliteration & Virtual Keyboard ---
function transliterateWord(input) {
    let text = input.toLowerCase();
    for (let [eng, tam] of TAMIL_MAP) {
        const regex = new RegExp(eng, 'g');
        text = text.replace(regex, tam);
    }
    return text;
}

function handleTransliteration(event) {
    if (event.key === ' ' || event.key === 'Enter') {
        const cursorPosition = editor.selectionStart;
        const textBeforeCursor = editor.value.substring(0, cursorPosition);
        const textAfterCursor = editor.value.substring(cursorPosition);

        // Extract words separated by spaces or newlines
        const words = textBeforeCursor.split(/(\s+)/);
        
        if (words.length > 0) {
            // Find the last typed word segment
            const lastWordIndex = words.length - 1;
            const wordToTransliterate = words[lastWordIndex];

            // If the last word is in English characters, convert it
            if (/^[a-zA-Z]+$/.test(wordToTransliterate)) {
                event.preventDefault(); // Prevent double spacing

                const transliterated = transliterateWord(wordToTransliterate);
                words[lastWordIndex] = transliterated;

                const spaceOrNewline = (event.key === 'Enter') ? '\n' : ' ';
                
                // Reassemble text with transliterated word + space
                editor.value = words.join('') + spaceOrNewline + textAfterCursor;

                // Move cursor right after the newly inserted Tamil word and space
                const newCursorPos = words.join('').length + spaceOrNewline.length;
                editor.setSelectionRange(newCursorPos, newCursorPos);

                // Save to localStorage
                if (currentBook) {
                    localStorage.setItem(getStorageKeyText(currentBook), editor.value);
                }
            }
        }
    }
}

function insertCharacter(char) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const val = editor.value;

    editor.value = val.substring(0, start) + char + val.substring(end);
    const newPos = start + char.length;
    editor.setSelectionRange(newPos, newPos);
    editor.focus();
    if (currentBook) {
        localStorage.setItem(getStorageKeyText(currentBook), editor.value);
    }
}

function buildVirtualKeyboard() {
    const vowels = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ", "ஃ"];
    const consonants = ["க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன", "ஶ", "ஜ", "ஷ", "ஸ", "ஹ"];
    const diacritics = ["்", "ா", "ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ"];

    const renderRow = (containerId, chars) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        chars.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = char;
            btn.onclick = () => insertCharacter(char);
            container.appendChild(btn);
        });
    };

    renderRow('vowelKeys', vowels);
    renderRow('consonantKeys', consonants);
    renderRow('diacriticKeys', diacritics);
}

let originalFileHandle = null;

async function saveFileDirectly() {
    try {
        if (!originalFileHandle) {
            [originalFileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] }
                }]
            });
        }

        const writable = await originalFileHandle.createWritable();
        await writable.write(editor.value);
        await writable.close();

        alert(`Successfully saved updates back to the original file!`);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            alert('Failed to save directly: ' + err.message);
        }
    }
}