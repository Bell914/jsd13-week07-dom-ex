// Write your demo code here, section by section.
// The HTML file has matching ids/classes for each topic:
//
// 1. Selecting Elements   -> #main-title, .submit-btn, .task
console.log(document.getElementById("main-title"));
console.log(document.getElementsByClassName("submit-btn"))

// 2. Modifying Content    -> .label, #msg, #card
console.log(document.getElementById("modify-name").textContent);
const h2Name = document.getElementById("modify-name");
h2Name.textContent = "Feel Good"
console.log(h2Name);
h2Name.style.backgroundColor = '#5372D9';

const cardImg = document.getElementById("card");
cardImg.innerHTML = `<img src="path/to/image.jpg" alt="description">`;

// 3. classList            -> #themeBtn, .card
// 4. Create & Remove      -> #addTaskBtn, #resetTasksBtn, #tasks
// 5. Events               -> #click-me, #list, #signupForm, #email, .error

const btn= document.querySelector("#click-me");
let count = 0;
const eventDiv = document.querySelector("#event-div");
btn.addEventListener("click", (e) => {
    eventDiv.innerHTML += `<img width="200px" height="200px" src="https://i.pinimg.com/736x/11/4e/1c/114e1c3ee4f24c335e153fd99eb46ac1.jpg">`;
});

document.addEventListener("keydown",(event) => {
    console.log(event);
    console.log(event.key);
});

// 6. Pokémon Card Fetcher -> #fetchBtn, #resetBtn, #gallery
const emailInput = document.querySelector("#email");

emailInput.addEventListener("input", (e) => {
    console.log(e.target.value);
    eventDiv.textContent += e.target.value;
})