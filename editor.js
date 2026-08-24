/**
 * Editor UI, Transliteration, Done Tracking & Exports
 */

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

let replacements = {};
let completedSet = new Set();

export function renderCards(reviewData, filter, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const filtered = filter === 'ALL' ? reviewData : reviewData.filter(i => i.file === filter);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px; color: #666;">No items to review!</p>';
        return;
    }

    filtered.forEach((item, index) => {
        const isDone = completedSet.has(index);
        const card = document.createElement('div');
        card.className = `card ${isDone ? 'card-completed' : ''}`;
        card.id = `card-${index}`;
        card.innerHTML = `
            <div class="card-header">
                <span><strong>File:</strong> ${escapeHtml(item.file)}</span>
                <div>
                    <span class="badge ${isDone ? 'badge-done' : 'badge-pending'}" id="badge-${index}">
                        ${isDone ? 'Done' : 'Pending'}
                    </span>
                    <span class="flagged-word-badge">${escapeHtml(item.word)}</span>
                </div>
            </div>
            <div class="paragraph-preview">${item.paragraph}</div>
            <textarea id="edit-para-${index}" class="editable-paragraph">${escapeHtml(item.raw_paragraph)}</textarea>
            <div class="actions">
                <button class="btn btn-done" data-action="toggleDone" data-index="${index}">${isDone ? 'Mark as Pending' : 'Mark as Done'}</button>
                <button class="btn btn-save" data-action="save" data-index="${index}" data-word="${escapeHtml(item.word)}">Save Correction</button>
                <button class="btn btn-skip" data-action="skip" data-index="${index}">Skip</button>
            </div>
        `;
        container.appendChild(card);

        const textarea = card.querySelector(`#edit-para-${index}`);
        textarea.addEventListener('keyup', (e) => handleTransliteration(e, textarea));
    });

    updateProgressTracker(reviewData.length);
}

export function toggleDoneState(index, totalItems) {
    const card = document.getElementById(`card-${index}`);
    const badge = document.getElementById(`badge-${index}`);
    const toggleBtn = card ? card.querySelector('[data-action="toggleDone"]') : null;

    if (completedSet.has(index)) {
        completedSet.delete(index);
        if (card) card.classList.remove('card-completed');
        if (badge) {
            badge.className = 'badge badge-pending';
            badge.textContent = 'Pending';
        }
        if (toggleBtn) toggleBtn.textContent = 'Mark as Done';
    } else {
        completedSet.add(index);
        if (card) card.classList.add('card-completed');
        if (badge) {
            badge.className = 'badge badge-done';
            badge.textContent = 'Done';
        }
        if (toggleBtn) toggleBtn.textContent = 'Mark as Pending';
    }

    updateProgressTracker(totalItems);
}

function updateProgressTracker(total) {
    const tracker = document.getElementById('progressTracker');
    if (tracker) {
        tracker.textContent = `${completedSet.size}/${total} Done`;
    }
}

function transliterateWord(input) {
    let text = input.toLowerCase();
    for (let [eng, tam] of TAMIL_MAP) {
        text = text.replace(new RegExp(eng, 'g'), tam);
    }
    return text;
}

function handleTransliteration(event, textarea) {
    if (event.key === ' ' || event.key === 'Enter') {
        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        const textAfterCursor = textarea.value.substring(cursorPosition);
        const words = textBeforeCursor.split(/(\s+)/);

        if (words.length > 0) {
            const lastWordIndex = words.length - 2;
            if (lastWordIndex >= 0 && /^[a-zA-Z]+$/.test(words[lastWordIndex])) {
                words[lastWordIndex] = transliterateWord(words[lastWordIndex]);
                textarea.value = words.join('') + textAfterCursor;
                textarea.selectionStart = textarea.selectionEnd = cursorPosition;
            }
        }
    }
}

export function saveCorrection(index, originalWord, reviewData) {
    const textarea = document.getElementById(`edit-para-${index}`);
    if (!textarea) return;

    const item = reviewData[index] || {};
    replacements[originalWord] = {
        file: item.file || "Unknown",
        original_paragraph: item.raw_paragraph || "",
        corrected_paragraph: textarea.value
    };

    if (!completedSet.has(index)) {
        toggleDoneState(index, reviewData.length);
    }

    const card = document.getElementById(`card-${index}`);
    if (card) card.style.display = 'none';
}

export function skipItem(index) {
    const card = document.getElementById(`card-${index}`);
    if (card) card.style.display = 'none';
}

export function exportReplacements() {
    if (Object.keys(replacements).length === 0) {
        alert("No corrections made yet!");
        return;
    }
    const exportPayload = {
        replacements: replacements,
        completed_indices: Array.from(completedSet)
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "replacements.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}