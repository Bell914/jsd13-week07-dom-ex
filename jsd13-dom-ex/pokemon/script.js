const pokedex = document.getElementById('pokedex');
const inputPokemon = document.getElementById('input-pokemon');
const btnFind = document.getElementById('btn-find');
const btnRandom = document.getElementById('btn-random');
const btnReset = document.getElementById('btn-reset');
const introScreen = document.getElementById('intro-screen');
const spiralContainer = document.getElementById('spiral-container');

// รายการรูปภาพโปเกมอน Official Artwork สำหรับหมุนวนใน Spiral Vortex หน้า Intro
const POKEMON_INTRO_IMAGES = [
    { name: "Pikachu", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" },
    { name: "Charizard", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
    { name: "Blastoise", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png" },
    { name: "Venusaur", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png" },
    { name: "Gengar", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" },
    { name: "Mewtwo", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png" },
    { name: "Mew", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png" },
    { name: "Eevee", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png" },
    { name: "Lucario", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" },
    { name: "Gyarados", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png" },
    { name: "Rayquaza", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png" },
    { name: "Dragonite", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png" },
    { name: "Snorlax", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png" },
    { name: "Lugia", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png" },
    { name: "Zapdos", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/145.png" },
    { name: "Articuno", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/144.png" },
    { name: "Moltres", src: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/146.png" },
];

// เริ่มต้นสร้าง Spiral Vortex บนหน้า Intro
let spiral = null;
if (typeof attachSpiralImages === 'function' && spiralContainer) {
    spiral = attachSpiralImages(spiralContainer, {
        images: POKEMON_INTRO_IMAGES,
        turns: 3.5,
        speed: 2.2,
        spacing: 5,
        spread: 6,
        sizeAttenuation: 2,
        imageSize: 180,
        fadeIn: 20,
        fadeOut: 0,
        cornerRadius: 8,
    });
}

// คลิกที่หน้าจอ Intro เพื่อเข้าสู่หน้าหลัก
if (introScreen) {
    const enterMainApp = () => {
        introScreen.classList.add('hide');
        setTimeout(() => {
            if (spiral) spiral.pause();
        }, 700);
    };

    introScreen.addEventListener('click', enterMainApp);
    window.addEventListener('keydown', (e) => {
        if (!introScreen.classList.contains('hide') && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
            enterMainApp();
        }
    });
}

// ผูก Emoji Burst เข้ากับปุ่มทั้ง 3 ปุ่ม (Find Pokemon, Random, Reset)
if (typeof attachEmojiBurst === 'function') {
    // ปุ่ม Find Pokemon (โทนแว่นขยาย, แสงประกาย, สายฟ้า)
    attachEmojiBurst(btnFind, {
        emojis: "🔍,✨,⭐,⚡,💫,🎯",
        burstCount: 12,
    });

    // ปุ่ม Random (โทนเต๋า, ปาร์ตี้, สายฟ้า, ไฟ)
    attachEmojiBurst(btnRandom, {
        emojis: "🎲,⚡,🎉,✨,🔥,⭐",
        burstCount: 14,
    });

    // ปุ่ม Reset (โทนระเบิด, กวาดล้าง, ฝุ่นควัน, น้ำแข็ง)
    attachEmojiBurst(btnReset, {
        emojis: "💥,💨,🧹,🗑️,✨,❄️",
        burstCount: 14,
    });
}

// เริ่มต้นสร้าง 3D Coverflow Gallery บน #pokedex (เริ่มต้นว่างเปล่า)
let coverflow = null;
if (typeof attachCoverflow === 'function') {
    coverflow = attachCoverflow(pokedex, {
        cardWidth: 280,
        cardHeight: 400,
        radius: 4,
        tilt: 14,
        sideTilt: 7,
        gap: 8,
        opacity: 60,
        perspective: 1600,
        transitionDuration: 0.6,
        transitionEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
}

// ฟังก์ชันสร้าง Card DOM element สำหรับโปเกมอน
function createPokemonCardElement(data) {
    const cardContent = document.createElement('div');
    cardContent.className = 'pokemon-card-content';

    // ส่วนหัว: ชื่อโปเกมอน + เลข ID
    const header = document.createElement('div');
    header.className = 'pokemon-header';

    const name = document.createElement('p');
    name.className = 'pokemon-card-name';
    name.textContent = data.name;

    const id = document.createElement('p');
    id.className = 'pokemon-card-id';
    id.textContent = `#${String(data.id).padStart(3, '0')}`;

    header.append(name, id);

    // กรอบรูปโปเกมอน
    const imgFrame = document.createElement('div');
    imgFrame.className = 'pokemon-img-frame';

    const img = document.createElement('img');
    img.className = 'pokemon-card-img';
    img.src = data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || '';
    img.alt = data.name;
    imgFrame.append(img);

    // ป้ายประเภท (Types)
    const typesContainer = document.createElement('div');
    typesContainer.className = 'pokemon-types';
    if (data.types) {
        data.types.forEach((t) => {
            const badge = document.createElement('span');
            badge.className = `pokemon-type-badge type-${t.type.name}`;
            badge.textContent = t.type.name;
            typesContainer.append(badge);
        });
    }

    // สเตตัส (Stats Box)
    const statsBox = document.createElement('div');
    statsBox.className = 'pokemon-stats';
    if (data.stats) {
        data.stats.forEach((s) => {
            const statLine = document.createElement('p');
            statLine.innerHTML = `<span>${s.stat.name}</span><strong>${s.base_stat}</strong>`;
            statsBox.append(statLine);
        });
    }

    cardContent.append(header, imgFrame, typesContainer, statsBox);
    return cardContent;
}

// ฟังก์ชันกลาง: รับ id หรือชื่อ แล้วไปดึงข้อมูลจาก PokeAPI มาสร้างการ์ดใน Coverflow
async function showPokemon(query) {
    try {
        const findPokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

        if (!findPokemon.ok) {
            // ถ้าหาไม่เจอ (เช่นพิมพ์ชื่อผิด) ให้แจ้งเตือน
            const warning = document.createElement('p');
            warning.classList.add('not-found');
            warning.textContent = `ไม่พบโปเกมอน "${query}"`;
            pokedex.parentElement.insertBefore(warning, pokedex);
            setTimeout(() => warning.remove(), 2500);
            return;
        }

        const data = await findPokemon.json();
        const cardElement = createPokemonCardElement(data);

        if (coverflow) {
            // เพิ่มการ์ดเข้าสู่ 3D Coverflow และเลื่อนโฟกัสมาที่การ์ดใหม่ทันที
            coverflow.addSlide({
                title: data.name,
                customElement: cardElement,
                data: data
            }, true);
        } else {
            // โหมด fallback กรณีไม่มี coverflow.js
            const div = document.createElement('div');
            div.classList.add('pokemon-card');
            div.append(cardElement);
            div.addEventListener('click', () => div.remove());
            pokedex.append(div);
        }
    } catch (err) {
        console.error('Error fetching pokemon:', err);
    }
}

// ปุ่ม Find Pokemon: ค้นหาตามชื่อ/id ที่พิมพ์ในช่อง input
btnFind.addEventListener('click', () => {
    const query = inputPokemon.value.trim().toLowerCase();
    if (!query) return;
    showPokemon(query);
    inputPokemon.value = '';
});

// กด Enter ในช่อง input ก็ค้นหาได้เหมือนกด Find Pokemon
inputPokemon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        btnFind.click();
    }
});

// ปุ่ม Random: สุ่มเลข id 1-898 แล้วเรียก showPokemon
btnRandom.addEventListener('click', () => {
    const randomId = Math.floor(Math.random() * 898) + 1;
    showPokemon(randomId);
});

// ปุ่ม Reset: ลบการ์ดทั้งหมดออกจากหน้าจอ
btnReset.addEventListener('click', () => {
    if (coverflow) {
        coverflow.clear();
    } else {
        pokedex.innerHTML = '';
    }
    inputPokemon.value = '';
});