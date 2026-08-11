const pokedex = document.getElementById('pokedex');
const inputPokemon = document.getElementById('input-pokemon');
const btnFind = document.getElementById('btn-find');
const btnRandom = document.getElementById('btn-random');
const btnReset = document.getElementById('btn-reset');

// ฟังก์ชันกลาง: รับ id หรือชื่อ แล้วไปดึงข้อมูลจาก PokeAPI มาสร้างการ์ด
async function showPokemon(query) {
    try {
        const findPokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

        if (!findPokemon.ok) {
            // ถ้าหาไม่เจอ (เช่นพิมพ์ชื่อผิด) ให้แจ้งเตือนแทนที่จะพัง
            const warning = document.createElement('p');
            warning.classList.add('not-found');
            warning.textContent = `ไม่พบโปเกมอน "${query}"`;
            pokedex.append(warning);
            setTimeout(() => warning.remove(), 2000);
            return;
        }

        const data = await findPokemon.json();
        console.log(data);

        const div = document.createElement('div');
        div.classList.add('pokemon-card');

        const type = data.types[0].type.name;
        div.classList.add(`type-${type}`);

        const name = document.createElement('p');
        name.classList.add('pokemon-name');
        name.textContent = data.name;

        const img = document.createElement('img');
        img.src = data.sprites.front_default;

        div.append(name);
        div.append(img);

        const statsBox = document.createElement('div');
        statsBox.classList.add('pokemon-stats');
        data.stats.forEach((s) => {
            const statLine = document.createElement('p');
            statLine.textContent = `${s.stat.name}: ${s.base_stat}`;
            statsBox.append(statLine);
        });
        div.append(statsBox);

        pokedex.append(div);

        div.addEventListener('click', () => {
            div.remove();
        });
    } catch (err) {
        console.error(err);
    }
}

// ปุ่ม Find Pokemon: ค้นหาตามชื่อ/id ที่พิมพ์ในช่อง input
btnFind.addEventListener('click', () => {
    const query = inputPokemon.value.trim().toLowerCase();
    if (!query) return; // ไม่ทำอะไรถ้าช่องว่าง
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
    pokedex.innerHTML = '';
    inputPokemon.value = '';
});