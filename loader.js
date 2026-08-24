/**
 * Data Loading, Parsing, and Normalization
 */

export function normalizeReviewData(parsed) {
    let rawList = [];

    if (Array.isArray(parsed)) {
        rawList = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
        rawList = Object.keys(parsed).map(key => {
            const val = parsed[key];
            if (typeof val === 'string') {
                return { word: key, paragraph: val, raw_paragraph: val, file: 'Legacy Import' };
            }
            return { word: key, ...val };
        });
    }

    return rawList.map((item, idx) => {
        if (typeof item === 'string') {
            return {
                id: idx + 1,
                word: item,
                file: 'Legacy File',
                paragraph: escapeHtml(item),
                raw_paragraph: item
            };
        }

        const word = item.word || item.flagged_word || item.target || item.key || 'N/A';
        let rawPara = item.raw_paragraph || item.paragraph || item.context || item.text || item.sentence || word;
        let displayPara = item.paragraph || item.context_paragraph || rawPara;

        return {
            id: item.id || idx + 1,
            file: item.file || item.filename || item.source_file || item.book || 'Unknown File',
            word: word,
            paragraph: displayPara,
            raw_paragraph: rawPara
        };
    });
}

export async function fetchAutoLoad() {
    const response = await fetch('words_for_review.json');
    if (!response.ok) throw new Error("File not found");
    const json = await response.json();
    return normalizeReviewData(json);
}

export function parseAndNormalize(jsonString) {
    const parsed = JSON.parse(jsonString);
    return normalizeReviewData(parsed);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}