// DOM Exercise: To-Do List
// Work through the TODOs in order. Open index.html in a browser to test.

// TODO 1: Select the elements you'll need:
//   - the form (#todo-form)
//   - the input (#todo-input)
//   - the list (#todo-list)
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");


// TODO 2: Listen for the form's "submit" event. Inside the handler:
//   - call event.preventDefault() so the page doesn't reload
//   - read and trim the input's value
//   - if it's empty, do nothing (return)
//   - otherwise, create a new to-do item (see TODO 3) and clear the input
todoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = todoInput.value.trim();
    if (text === "") return;

    addTodo(text);
    todoInput.value = "";
});



// TODO 3: Write a function addTodo(text) that:
//   - creates an <li>
//   - creates a <span class="todo-text"> inside it containing the text
//   - creates a <button class="delete-btn"> inside it with text "x"
//   - appends the <li> to the list
//
// Hint: use document.createElement, textContent, and append/appendChild.
function addTodo(text) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.classList.add("todo-text");
    span.textContent = text;

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "x";

    li.appendChild(span);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
}


// TODO 4: When the delete button inside an <li> is clicked, remove that <li>
// from the list. (Attach this listener when you create the button in TODO 3.)


// TODO 5: When the todo-text span inside an <li> is clicked, toggle the
// "completed" class on the <li>. (Attach this listener when you create the
// span in TODO 3.)

