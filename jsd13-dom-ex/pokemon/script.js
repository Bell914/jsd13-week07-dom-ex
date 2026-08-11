const pokedex = document.getElementById('pokedex');
const btnPokemon = document.getElementById('btn-pokemon');

btnPokemon.addEventListener('click', async()=>{
    const findPokemon = await fetch('https://pokeapi.co/api/v2/pokemon/67'); //รอเพื่อรอจับข้อมูลมาที่ฝั่ง
    const data = await findPokemon.json(); //รอเพื่อแปลงข้อมูลมาเป็น json 
    console.log(data); //เพิ่มค่า
    //pokedex.innerHTML = `${data.name} <img src="${data.sprites.front_default}">`;
    const div = document.createElement('div'); //สร้างกล่อง div
    const name = document.createElement('p');
    const img = document.createElement('img');
    name.textContent = data.name;
    img.src = data.sprites.front_default;
    div.append(name);
    div.append(img);
    pokedex.append(div); //ทุกครั้งที่กันสร้าง มันจะสร้างขึ้นมาใหม่เพื่อรวนอันอีกครั้ง
});