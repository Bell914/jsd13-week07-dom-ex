// Cookie Clicker Game Logic

// 1. สถานะเกม (Game State)
let score = 0;
let clickPower = 1;
let cps = 0;
let costClick = 10;
let costAuto = 50;

// 2. อ้างอิง DOM Elements
const scoreElement = document.getElementById("score");
const cpsElement = document.getElementById("cps");
const cookieBtn = document.getElementById("cookie-btn");
const upgradeClickBtn = document.getElementById("upgrade-click");
const costClickElement = document.getElementById("cost-click");
const upgradeAutoBtn = document.getElementById("upgrade-auto");
const costAutoElement = document.getElementById("cost-auto");

// 3. ฟังก์ชันอัปเดตหน้าจอและการเปิด/ปิดปุ่มอัปเกรด
function updateUI() {
  scoreElement.textContent = score;
  cpsElement.textContent = cps;
  costClickElement.textContent = costClick;
  costAutoElement.textContent = costAuto;

  // เปิดใช้งานปุ่มเมื่อมีคุกกี้เพียงพอ
  upgradeClickBtn.disabled = score < costClick;
  upgradeAutoBtn.disabled = score < costAuto;
}

// 4. เมื่อคลิกที่คุกกี้
cookieBtn.addEventListener("click", () => {
  score += clickPower;
  updateUI();
});

// 5. อัปเกรดพลังคลิก (+1 คุกกี้ต่อคลิก)
upgradeClickBtn.addEventListener("click", () => {
  if (score >= costClick) {
    score -= costClick;
    clickPower += 1;
    costClick = Math.floor(costClick * 1.5); // เพิ่มราคาขึ้น 1.5 เท่า
    updateUI();
  }
});

// 6. อัปเกรดคุณยายช่วยอบ (+1 คุกกี้ต่อวินาที)
upgradeAutoBtn.addEventListener("click", () => {
  if (score >= costAuto) {
    score -= costAuto;
    cps += 1;
    costAuto = Math.floor(costAuto * 1.5); // เพิ่มราคาขึ้น 1.5 เท่า
    updateUI();
  }
});

// 7. ระบบผลิตคุกกี้อัตโนมัติทุกๆ 1 วินาที
setInterval(() => {
  if (cps > 0) {
    score += cps;
    updateUI();
  }
}, 1000);

// อัปเดตหน้าจอเริ่มต้น
updateUI();
