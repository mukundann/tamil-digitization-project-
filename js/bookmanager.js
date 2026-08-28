/**
 * Book & Page State Management
 */

export let AVAILABLE_BOOKS = [];
export let currentBook = "";
export let currentPage = 1;

export const getStorageKeyText = (book) => `tamil_ocr_text_${book}`;
export const getStorageKeyScroll = (book) => `tamil_ocr_scroll_${book}`;
export const getStorageKeyPage = (book) => `tamil_ocr_page_${book}`;

export async function loadBookManifest(onBookSelected) {
    try {
        const res = await fetch('output_texts/manifest.json');
        if (!res.ok) throw new Error("Could not fetch manifest.json");

        AVAILABLE_BOOKS = await res.json();

        if (Array.isArray(AVAILABLE_BOOKS) && AVAILABLE_BOOKS.length > 0) {
            populateBookDropdown();

            const savedBook = localStorage.getItem("last_selected_book");
            if (savedBook && AVAILABLE_BOOKS.includes(savedBook)) {
                currentBook = savedBook;
            } else {
                currentBook = AVAILABLE_BOOKS[0];
            }

            document.getElementById('bookSelect').value = currentBook;
            onBookSelected(currentBook);
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

export function switchBook(bookId, loadBookCallback) {
    if (!bookId) return;
    currentBook = bookId;
    localStorage.setItem("last_selected_book", bookId);
    loadBookCallback(bookId);
}

export function loadPageImage(pageNum, pageImgElement) {
    if (!currentBook) return;

    const padded4 = String(pageNum).padStart(4, '0');
    const padded3 = String(pageNum).padStart(3, '0');
    const padded2 = String(pageNum).padStart(2, '0');
    const rawNum = String(pageNum);

    const basePath = `output_texts/${currentBook}/images`;

    const tryLoadImage = (paths) => {
        if (paths.length === 0) return;
        const currentPath = paths.shift();

        const testImg = new Image();
        testImg.onload = () => {
            pageImgElement.src = currentPath;
        };
        testImg.onerror = () => {
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

export function changePage(delta, pageImgElement) {
    const newPage = currentPage + delta;
    if (newPage >= 1) {
        currentPage = newPage;
        loadPageImage(currentPage, pageImgElement);
    }
}

export function goToPage(val, pageImgElement) {
    const pageNum = parseInt(val);
    if (pageNum >= 1) {
        currentPage = pageNum;
        loadPageImage(currentPage, pageImgElement);
    }
}

export function setCurrentPage(page) {
    currentPage = page;
}


let currentZoom = 1.0;

export function zoomImage(factor, pageImgElement) {
    if (!pageImgElement) return;
    currentZoom *= factor;
    // Restrict zoom limits between 0.5x and 4x
    currentZoom = Math.min(Math.max(0.5, currentZoom), 4.0);
    pageImgElement.style.transform = `scale(${currentZoom})`;
    pageImgElement.style.transformOrigin = 'top left';
}

export function resetZoom(pageImgElement) {
    if (!pageImgElement) return;
    currentZoom = 1.0;
    pageImgElement.style.transform = `scale(1.0)`;
}