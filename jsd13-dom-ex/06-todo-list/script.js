// DOM Exercise: To-Do List
// Work through the TODOs in order. Open index.html in a browser to test.

// TODO 1: Select the elements you'll need:
//   - the form (#todo-form)
//   - the input (#todo-input)
//   - the list (#todo-list)


// TODO 2: Listen for the form's "submit" event. Inside the handler:
//   - call event.preventDefault() so the page doesn't reload
//   - read and trim the input's value
//   - if it's empty, do nothing (return)
//   - otherwise, create a new to-do item (see TODO 3) and clear the input


// TODO 3: Write a function addTodo(text) that:
//   - creates an <li>
//   - creates a <span class="todo-text"> inside it containing the text
//   - creates a <button class="delete-btn"> inside it with text "x"
//   - appends the <li> to the list
//
// Hint: use document.createElement, textContent, and append/appendChild.


// TODO 4: When the delete button inside an <li> is clicked, remove that <li>
// from the list. (Attach this listener when you create the button in TODO 3.)


// TODO 5: When the todo-text span inside an <li> is clicked, toggle the
// "completed" class on the <li>. (Attach this listener when you create the
// span in TODO 3.)
