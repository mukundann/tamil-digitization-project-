/**
 * Transliteration Engine & Virtual Keyboard Data
 */

export const TAMIL_MAP = [
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

export function transliterateWord(input) {
    let text = input.toLowerCase();
    for (let [eng, tam] of TAMIL_MAP) {
        const regex = new RegExp(eng, 'g');
        text = text.replace(regex, tam);
    }
    return text;
}

export function buildVirtualKeyboard(onInsertCallback) {
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
            btn.onclick = () => onInsertCallback(char);
            container.appendChild(btn);
        });
    };

    renderRow('vowelKeys', vowels);
    renderRow('consonantKeys', consonants);
    renderRow('diacriticKeys', diacritics);

    // Make Keyboard Element Draggable
    makeElementDraggable(document.getElementById('keyboardContainer'));
}

function makeElementDraggable(elmnt) {
    if (!elmnt) return;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById('keyboardHeader') || elmnt;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        elmnt.style.bottom = 'auto';
        elmnt.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}