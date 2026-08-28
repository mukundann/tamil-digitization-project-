/**
 * Main Application Controller
 */

import { buildVirtualKeyboard } from './transliteration.js';

import { zoomImage, resetZoom } from './bookManager.js';
import {
    currentBook,
    loadBookManifest,
    switchBook,
    loadPageImage,
    changePage,
    goToPage,
    setCurrentPage,
    getStorageKeyPage,
    getStorageKeyText,
    getStorageKeyScroll
} from './bookManager.js';
import {
    restoreScroll,
    updatePosIndicator,
    handleTransliteration,
    insertCharacter,
    clearCurrentBookProgress,
    exportText,
    saveFileDirectly
} from './editor.js';

const editor = document.getElementById('textEditor');
const pageImg = document.getElementById('pageViewer');

document.addEventListener('DOMContentLoaded', async () => {
    buildVirtualKeyboard((char) => insertCharacter(editor, char));
    await loadBookManifest(loadBook);
    bindEvents();
});





function loadBook(bookId) {
    if (!bookId) return;
    document.getElementById('currentBookLabel').textContent = bookId;

    const savedPage = localStorage.getItem(getStorageKeyPage(bookId));
    const initialPage = savedPage ? parseInt(savedPage) : 1;
    setCurrentPage(initialPage);
    loadPageImage(initialPage, pageImg);

    const savedText = localStorage.getItem(getStorageKeyText(bookId));
    if (savedText !== null) {
        editor.value = savedText;
        restoreScroll(editor, bookId);
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

function bindEvents() {
    // Book Selector
    document.getElementById('bookSelect')?.addEventListener('change', (e) => switchBook(e.target.value, loadBook));

    // Page Controls
    window.changePage = (delta) => changePage(delta, pageImg);
    window.goToPage = (val) => goToPage(val, pageImg);

    // Text Editor Listeners
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
    // 1. Change keyup to keydown so Space/Enter key presses are intercepted BEFORE insertion
    editor.addEventListener('keydown', (e) => {
        handleTransliteration(e, editor);
    });

    editor.addEventListener('keyup', (e) => {
        updatePosIndicator(editor);
        handleTransliteration(e, editor);
    });

    editor.addEventListener('click', () => updatePosIndicator(editor));

    // File Operations
    document.getElementById('txtFileInput')?.addEventListener('change', function (e) {
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

    // Global Actions
    window.clearCurrentBookProgress = () => clearCurrentBookProgress(loadBook);
    window.exportText = () => exportText(editor);
    window.saveFileDirectly = () => saveFileDirectly(editor);
}



// Inside bindEvents() in js/app.js
window.zoomIn = () => zoomImage(1.2, pageImg);
window.zoomOut = () => zoomImage(0.8, pageImg);
window.resetImageZoom = () => resetZoom(pageImg);

// Reset zoom automatically whenever page changes
const originalLoadPageImage = loadPageImage;
window.changePage = (delta) => {
    changePage(delta, pageImg);
    resetZoom(pageImg);
};