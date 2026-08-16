// Write your demo code here, section by section.
// The HTML file has matching ids/classes for each topic:


// 1. Selecting Elements   -> #main-title, .submit-btn, .task
const mainTitle = document.getElementById("main-title");
const submitBtn = document.querySelector(".submit-btn");
const tasksList = document.querySelectorAll(".task");

console.log("1. Selecting Elements:");
console.log("mainTitle:", mainTitle);
console.log("submitBtn:", submitBtn);
console.log("tasksList:", tasksList);


// 2. Modifying Content    -> .label, #msg, #card
const label = document.querySelector(".label");
const msg = document.getElementById("msg");
const cardImg = document.getElementById("card");

label.textContent = "Label updated using textContent!";

msg.textContent = "Feel Good with JavaScript DOM!";
msg.style.backgroundColor = "#5372D9";
msg.style.color = "#ffffff";
msg.style.padding = "8px 12px";
msg.style.borderRadius = "6px";

cardImg.innerHTML = `<img width="160" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" alt="Pikachu">`;

// 3. classList            -> #themeBtn, .card
const themeBtn = document.getElementById("themeBtn");
const card = document.querySelector(".card");

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});


card.addEventListener("click", () => {
  card.classList.toggle("active");
});
// 4. Create & Remove      -> #addTaskBtn, #resetTasksBtn, #tasks
const addTaskBtn = document.getElementById("addTaskBtn");
const resetTasksBtn = document.getElementById("resetTasksBtn");
const tasks = document.getElementById("tasks");

addTaskBtn.addEventListener("click", () => {
  const li = document.createElement("li");
  li.textContent = `Task ${tasks.children.length + 1}`;
  li.classList.add("task-item");

  li.addEventListener("click", () => {
    li.remove();
  });

  tasks.append(li);
});

resetTasksBtn.addEventListener("click", () => {
  tasks.innerHTML = "";
});

// 5. Events               -> #click-me, #list, #signupForm, #email, .error
const clickMeBtn = document.getElementById("click-me");
const list = document.getElementById("list");
const signupForm = document.getElementById("signupForm");
const emailInput = document.getElementById("email");
const errorSpan = document.querySelector(".error");

const memeUrl = "https://digitorystyle.com/wp-content/uploads/2023/03/%E0%B8%A1%E0%B8%B5%E0%B8%A1-%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%AD%E0%B8%9A%E0%B8%9A%E0%B8%97%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1-4-768x768.jpg";

const memeContainer = document.createElement("div");
memeContainer.style.display = "flex";
memeContainer.style.flexWrap = "wrap";
memeContainer.style.gap = "10px";
memeContainer.style.marginTop = "10px";
memeContainer.style.marginBottom = "15px";
clickMeBtn.after(memeContainer);

clickMeBtn.addEventListener("click", () => {
  const img = document.createElement("img");
  img.src = memeUrl;
  img.width = 140;
  img.style.borderRadius = "8px";
  memeContainer.append(img);
});

list.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    e.target.classList.toggle("done");
  }
});

signupForm.addEventListener("submit", (e) => {
  e.preventDefault(); 
  const emailValue = emailInput.value.trim();

  if (!emailValue.includes("@")) {
    errorSpan.textContent = "Please enter a valid email address.";
  } else {
    errorSpan.textContent = "";
    alert(`Success! Email registered: ${emailValue}`);
    signupForm.reset();
  }
});

// 6. Pokémon Card Fetcher -> #fetchBtn, #resetBtn, #gallery
const fetchBtn = document.getElementById("fetchBtn");
const resetBtn = document.getElementById("resetBtn");
const gallery = document.getElementById("gallery");

fetchBtn.addEventListener("click", async () => {
  const randomId = Math.floor(Math.random() * 151) + 1; 
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const data = await response.json();

    const pokeCard = document.createElement("div");
    pokeCard.style.display = "inline-block";
    pokeCard.style.margin = "10px";
    pokeCard.style.padding = "10px";
    pokeCard.style.border = "1px solid #ccc";
    pokeCard.style.borderRadius = "8px";
    pokeCard.style.textAlign = "center";
    pokeCard.style.background = "#fafafa";

    pokeCard.innerHTML = `
      <h4 style="margin: 4px 0; text-transform: capitalize;">#${data.id} ${data.name}</h4>
      <img src="${data.sprites.front_default}" alt="${data.name}" width="100">
    `;

    gallery.append(pokeCard);
  } catch (error) {
    console.error("Error fetching pokemon:", error);
  }
});

resetBtn.addEventListener("click", () => {
  gallery.innerHTML = "";
});
