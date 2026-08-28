/**
 * Editor Operations, Persistence & Native File API
 */

import { currentBook, getStorageKeyText, getStorageKeyScroll, getStorageKeyPage } from './bookManager.js';
import { transliterateWord } from './transliteration.js';

let originalFileHandle = null;

export function restoreScroll(editorElement, bookId) {
    const savedScrollTop = localStorage.getItem(getStorageKeyScroll(bookId));
    if (savedScrollTop !== null) {
        setTimeout(() => {
            editorElement.scrollTop = parseInt(savedScrollTop);
        }, 100);
    }
}

export function updatePosIndicator(editorElement) {
    const textLines = editorElement.value.substr(0, editorElement.selectionStart).split("\n");
    const line = textLines.length;
    const col = textLines[textLines.length - 1].length + 1;
    document.getElementById('posIndicator').textContent = `Line: ${line} | Col: ${col}`;
}

export function handleTransliteration(event, editorElement) {
    if (event.key === ' ' || event.key === 'Enter') {
        const cursorPosition = editorElement.selectionStart;
        const textBeforeCursor = editorElement.value.substring(0, cursorPosition);
        const textAfterCursor = editorElement.value.substring(cursorPosition);

        const words = textBeforeCursor.split(/(\s+)/);

        if (words.length > 0) {
            const lastWordIndex = words.length - 1;
            const wordToTransliterate = words[lastWordIndex];

            if (/^[a-zA-Z]+$/.test(wordToTransliterate)) {
                event.preventDefault();

                const transliterated = transliterateWord(wordToTransliterate);
                words[lastWordIndex] = transliterated;

                const spaceOrNewline = (event.key === 'Enter') ? '\n' : ' ';

                editorElement.value = words.join('') + spaceOrNewline + textAfterCursor;

                const newCursorPos = words.join('').length + spaceOrNewline.length;
                editorElement.setSelectionRange(newCursorPos, newCursorPos);

                if (currentBook) {
                    localStorage.setItem(getStorageKeyText(currentBook), editorElement.value);
                }
            }
        }
    }
}

export function insertCharacter(editorElement, char) {
    const start = editorElement.selectionStart;
    const end = editorElement.selectionEnd;
    const val = editorElement.value;

    editorElement.value = val.substring(0, start) + char + val.substring(end);
    const newPos = start + char.length;
    editorElement.setSelectionRange(newPos, newPos);
    editorElement.focus();

    if (currentBook) {
        localStorage.setItem(getStorageKeyText(currentBook), editorElement.value);
    }
}

export function clearCurrentBookProgress(reloadBookCallback) {
    if (!currentBook) return;
    if (confirm(`Reset saved edits, page number, and scroll position for '${currentBook}'?`)) {
        localStorage.removeItem(getStorageKeyText(currentBook));
        localStorage.removeItem(getStorageKeyScroll(currentBook));
        localStorage.removeItem(getStorageKeyPage(currentBook));
        reloadBookCallback(currentBook);
    }
}

export function exportText(editorElement) {
    const textContent = editorElement.value;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${currentBook || 'book'}_corrected.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export async function saveFileDirectly(editorElement) {
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
        await writable.write(editorElement.value);
        await writable.close();

        alert(`Successfully saved updates back to the original file!`);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            alert('Failed to save directly: ' + err.message);
        }
    }
}