// Cookie Clicker Game Logic

// 1. สถานะเกม (Game State)
let score = 0;
let clickPower = 1;
let cps = 0;
let costClick = 10;
let costAuto = 50;
let totalCookies = 0;
let totalClicks = 0;

// สถานะเลเวลและ 8-Bit XP System
let level = 1;
let xp = 0;
let xpMax = 100;

// สถานะ HP และ Mana ของผู้เล่น
let hp = 100;
let hpMax = 100;
let mana = 50;
let manaMax = 50;

// 2. อ้างอิง DOM Elements
const scoreElement = document.getElementById("score");
const cpsElement = document.getElementById("cps");
const cookieBtn = document.getElementById("cookie-btn");
const upgradeClickBtn = document.getElementById("upgrade-click");
const costClickElement = document.getElementById("cost-click");
const upgradeAutoBtn = document.getElementById("upgrade-auto");
const costAutoElement = document.getElementById("cost-auto");

// อ้างอิง DOM ของ 8-Bit Player Profile Card
const levelNumElement = document.getElementById("level-num");
const xpPercentElement = document.getElementById("xp-percent");
const xpBarFill = document.getElementById("xp-bar-fill");
const levelUpBanner = document.getElementById("level-up-banner");
const xpCurrentElement = document.getElementById("xp-current");
const xpMaxElement = document.getElementById("xp-max");

const hpValElement = document.getElementById("hp-val");
const hpMaxElement = document.getElementById("hp-max");
const hpBarFill = document.getElementById("hp-bar-fill");

const manaValElement = document.getElementById("mana-val");
const manaMaxElement = document.getElementById("mana-max");
const manaBarFill = document.getElementById("mana-bar-fill");

// อ้างอิง DOM ของ 8-Bit Table
const tableTotalCookies = document.getElementById("table-total-cookies");
const tableClickPower = document.getElementById("table-click-power");
const tableCps = document.getElementById("table-cps");
const tableTotalClicks = document.getElementById("table-total-clicks");

// 3. ฟังก์ชันอัปเดตหน้าจอและการเปิด/ปิดปุ่มอัปเกรด
function updateUI() {
  scoreElement.textContent = score;
  cpsElement.textContent = cps;
  costClickElement.textContent = costClick;
  costAutoElement.textContent = costAuto;

  // อัปเดตเลเวลและค่า XP
  if (levelNumElement) levelNumElement.textContent = level;
  if (xpCurrentElement) xpCurrentElement.textContent = xp;
  if (xpMaxElement) xpMaxElement.textContent = xpMax;

  const percent = Math.min(100, Math.floor((xp / xpMax) * 100));
  if (xpPercentElement) xpPercentElement.textContent = `${percent}%`;
  if (xpBarFill) xpBarFill.style.width = `${percent}%`;

  // อัปเดต HP และ Mana Bar
  if (hpValElement) hpValElement.textContent = hp;
  if (hpMaxElement) hpMaxElement.textContent = hpMax;
  if (hpBarFill) hpBarFill.style.width = `${Math.min(100, (hp / hpMax) * 100)}%`;

  if (manaValElement) manaValElement.textContent = mana;
  if (manaMaxElement) manaMaxElement.textContent = manaMax;
  if (manaBarFill) manaBarFill.style.width = `${Math.min(100, (mana / manaMax) * 100)}%`;

  // อัปเดตข้อมูลในตาราง 8-Bit Table
  if (tableTotalCookies) tableTotalCookies.textContent = totalCookies;
  if (tableClickPower) tableClickPower.textContent = clickPower;
  if (tableCps) tableCps.textContent = `${cps}/s`;
  if (tableTotalClicks) tableTotalClicks.textContent = totalClicks;

  // เปิดใช้งานปุ่มเมื่อมีคุกกี้เพียงพอ
  upgradeClickBtn.disabled = score < costClick;
  upgradeAutoBtn.disabled = score < costAuto;
}

// 4. ฟังก์ชันเพิ่ม XP และคำนวณ Level Up
function addXP(amount) {
  xp += amount;

  while (xp >= xpMax) {
    xp -= xpMax;
    level += 1;
    xpMax = Math.floor(xpMax * 1.35); // เพิ่ม XP ขั้นต่ำของเลเวลถัดไป 35%
    
    // โบนัสเพิ่ม Max HP และ Max Mana เมื่อเลเวลอัป!
    hpMax += 25;
    hp = hpMax;
    manaMax += 15;
    mana = manaMax;

    triggerLevelUpAnimation();
  }

  updateUI();
}

// 5. แอนิเมชัน Level Up! (8-bit Flashing Animation)
function triggerLevelUpAnimation() {
  if (!levelUpBanner) return;
  
  levelUpBanner.textContent = `⭐ LEVEL ${level}! ⭐`;
  levelUpBanner.classList.remove("hidden");

  // ปิดแบนเนอร์ Level Up หลังจากแสดงผล 1.8 วินาที
  setTimeout(() => {
    levelUpBanner.classList.add("hidden");
  }, 1800);
}

// 6. เมื่อคลิกที่คุกกี้ (ได้คะแนน + ได้รับ XP)
cookieBtn.addEventListener("click", () => {
  score += clickPower;
  totalCookies += clickPower;
  totalClicks += 1;
  addXP(10 * clickPower); // ยิ่งพลังคลิกเยอะ ยิ่งได้ XP ไว
  updateUI();
});

// 7. อัปเกรดพลังคลิก (+1 คุกกี้ต่อคลิก)
upgradeClickBtn.addEventListener("click", () => {
  if (score >= costClick) {
    score -= costClick;
    clickPower += 1;
    costClick = Math.floor(costClick * 1.5); // เพิ่มราคาขึ้น 1.5 เท่า
    addXP(25); // โบนัส XP เมื่อซื้ออัปเกรด
    updateUI();
  }
});

// 8. อัปเกรดคุณยายช่วยอบ (+1 คุกกี้ต่อวินาที)
upgradeAutoBtn.addEventListener("click", () => {
  if (score >= costAuto) {
    score -= costAuto;
    cps += 1;
    costAuto = Math.floor(costAuto * 1.5); // เพิ่มราคาขึ้น 1.5 เท่า
    addXP(60); // โบนัส XP เมื่อซื้ออัปเกรด
    updateUI();
  }
});

// 9. ระบบผลิตคุกกี้อัตโนมัติทุกๆ 1 วินาที (ให้คะแนน + เพิ่ม XP ต่อเนื่อง)
setInterval(() => {
  if (cps > 0) {
    score += cps;
    totalCookies += cps;
    addXP(cps * 3);
    updateUI();
  }
}, 1000);

// 10. การทำงานของปุ่ม 8-Bit Buttons
const btnRetroBoost = document.getElementById("btn-retro-boost");
const btnResetGame = document.getElementById("btn-reset-game");

if (btnRetroBoost) {
  let isBoostActive = false;
  btnRetroBoost.addEventListener("click", () => {
    if (isBoostActive) return;
    isBoostActive = true;

    // เปิดใช้งาน Boost 2X นาน 10 วินาที
    const originalClickPower = clickPower;
    clickPower *= 2;
    btnRetroBoost.textContent = "⚡ BOOST ACTIVE (10s)!";
    btnRetroBoost.style.background = "#22c55e";

    setTimeout(() => {
      clickPower = originalClickPower;
      isBoostActive = false;
      btnRetroBoost.textContent = "⚡ BOOST 2X (Retro Font)";
      btnRetroBoost.style.background = "";
      updateUI();
    }, 10000);

    updateUI();
  });
}

if (btnResetGame) {
  btnResetGame.addEventListener("click", () => {
    if (confirm("คุณต้องการเริ่มเกมใหม่ทั้งหมดใช่หรือไม่?")) {
      score = 0;
      clickPower = 1;
      cps = 0;
      costClick = 10;
      costAuto = 50;
      level = 1;
      xp = 0;
      xpMax = 100;
      totalCookies = 0;
      totalClicks = 0;
      updateUI();
    }
  });
}

// อัปเดตหน้าจอเริ่มต้น
updateUI();


