// Form Events
// Open index.html and work through these in order.

// TODO 1: Select #signup-form, #name-input, #char-count, and #feedback.
const signupForm = document.getElementById("signup-form");
const nameInput = document.getElementById("name-input");
const charCount = document.getElementById("char-count");
const feedback = document.getElementById("feedback");

// TODO 2: Add an "input" listener on #name-input. Every time the user types,
// set char-count's textContent to the current length of the input's value
// (name-input.value.length).
nameInput.addEventListener("input", function(event) {
  charCount.textContent = nameInput.value.length;
});

// TODO 3: Add a "submit" listener on #signup-form. Inside it:
//   - call event.preventDefault() so the page doesn't reload
//   - read and trim the name input's value
//   - if it's empty, set feedback's textContent to "Name required"
//   - otherwise, set feedback's textContent to `Welcome, ${name}!`
signupForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = nameInput.value.trim();

  if (name === "") {
    feedback.textContent = "Name required";
  } else {
    feedback.textContent = `Welcome, ${name}!`;
  }
});