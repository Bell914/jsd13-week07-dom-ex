// Creating & Removing Elements
// Open index.html and work through these in order.

// TODO 1: Select #item-input, #add-item-btn, #items (the <ul>), and
// #item-count (the <span>).
const itemInput = document.getElementById("item-input");
const addItemBtn = document.getElementById("add-item-btn");
const items = document.getElementById("items");
const itemCount = document.getElementById("item-count");


// TODO 2: Write a function updateCount() that sets item-count's textContent
// to the number of <li> elements currently in the list (items.children.length).
function updateCount() {
  itemCount.textContent = items.children.length;
}


// TODO 3: Add a "click" listener on #add-item-btn. Inside it:
//   - read and trim the input's value; if empty, do nothing
//   - create a new <li>, set its textContent to the value
//   - add a "click" listener on the <li> that removes it (li.remove())
//     and then calls updateCount() again
//   - add the <li> to the TOP of the list using items.prepend(li)
//   - clear the input
//   - call updateCount()
addItemBtn.addEventListener("click", () => {
    const value = itemInput.value.trim();
    if (value === "") return;

    const li = document.createElement("li");
    li.textContent = value;

    li.addEventListener("click", () => {
        li.remove();
        updateCount();
    });

    items.prepend(li);
    itemInput.value = "";
    updateCount();
});
