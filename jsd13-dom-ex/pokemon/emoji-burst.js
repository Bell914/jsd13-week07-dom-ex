/**
 * Emoji Burst — vanilla JS version
 * แปลงมาจาก React/Framer component เดิม (MobileHaptics)
 *
 * หลักการแปลง React → Vanilla JS:
 * - useRef(...)                  → เก็บ reference ของ element ด้วยตัวแปรธรรมดา (closure)
 * - useState / useEffect         → ไม่จำเป็น เพราะไม่มี re-render แบบ React, ใช้ event listener ตรงๆ
 * - useCallback(fn, deps)        → ไม่ต้องกังวลเรื่อง memoization ใน vanilla JS ประกาศฟังก์ชันปกติได้เลย
 * - requestAnimationFrame loop   → หลักการเดิมทุกอย่าง (คำนวณ physics ทีละเฟรม)
 * - CSSProperties object         → เขียนเป็น el.style.xxx ตรงๆ แทน
 * - Framer-only props (isStatic, COMPONENT_DEFAULTS) → ตัดออก เพราะใช้นอก Framer ไม่เกี่ยวข้อง
 */

function attachEmojiBurst(button, options = {}) {
    // ----- ตั้งค่าเริ่มต้น (เทียบเท่า COMPONENT_DEFAULTS เดิม) -----
    const config = {
        emojis: options.emojis || "🎉,✨,😄,🔥,💥,⭐,💖,🤩,👍,🥳,🎊,😎",
        burstCount: options.burstCount ?? 16,
        power: options.power ?? 12,
        spread: options.spread ?? 55,
        gravity: (options.gravity ?? 4) * 0.15, // แปลงสเกล 1-10 เป็นค่าฟิสิกส์ เหมือนโค้ดเดิม
        emojiSize: options.emojiSize ?? 20,
        shakeIntensity: options.shakeIntensity ?? 6,
    };

    // ----- สร้าง container ห่อปุ่ม เพื่อใช้เป็นพื้นที่ปล่อย emoji -----
    // (เทียบเท่า containerRef ในโค้ดเดิม ที่ครอบทั้ง object + particle layer)
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";
    container.style.overflow = "visible";

    // แทรก container คั่นตำแหน่งเดิมของปุ่ม แล้วย้ายปุ่มเข้าไปข้างใน
    button.parentNode.insertBefore(container, button);
    container.appendChild(button);

    // ----- ชั้นสำหรับวาง particle emoji (เทียบเท่า layerRef) -----
    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.zIndex = "3";
    layer.style.pointerEvents = "none";
    layer.style.overflow = "visible";
    container.appendChild(layer);

    button.style.position = "relative";
    button.style.zIndex = "2";

    // ----- ตัวแปรเก็บ particle ทั้งหมดที่กำลังบิน (เทียบเท่า particlesRef) -----
    let particles = [];
    let rafId = 0;
    let lastTs = 0;

    // ----- ลูปคำนวณฟิสิกส์ทีละเฟรม (เทียบเท่า step() เดิม) -----
    function step(ts) {
        let dt = lastTs ? (ts - lastTs) / 16.6667 : 1;
        lastTs = ts;
        if (dt > 3) dt = 3;

        const H = container.clientHeight;
        const W = container.clientWidth;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.vy += config.gravity * dt; // แรงโน้มถ่วงดึงลง
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vrot * dt;
            p.life -= dt;

            // ลบ particle ที่หมดอายุ หรือบินออกนอกจอไปแล้ว
            if (p.life <= 0 || p.y > H + p.size * 2.5 || p.x < -p.size * 3 || p.x > W + p.size * 3) {
                p.el.remove();
                particles.splice(i, 1);
                continue;
            }

            const fade = p.life < 22 ? Math.max(0, p.life / 22) : 1;
            p.el.style.opacity = String(fade);
            p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
        }

        if (particles.length > 0) {
            rafId = requestAnimationFrame(step);
        } else {
            rafId = 0;
            lastTs = 0;
        }
    }

    // ----- ฟังก์ชันยิง burst (เทียบเท่า burst() เดิม) -----
    function burst() {
        const list = config.emojis.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
        const safe = list.length ? list : ["🎉"];

        // จุดกำเนิด = กึ่งกลางของปุ่ม
        const ox = button.offsetLeft + button.offsetWidth / 2;
        const oy = button.offsetTop + button.offsetHeight / 2;

        // เขย่าปุ่มตอนกด (เทียบเท่า obj.animate(...) เดิม)
        if (typeof button.animate === "function") {
            const s = config.shakeIntensity;
            button.animate(
                [
                    { transform: "translate(0px, 0px) rotate(0deg)" },
                    { transform: `translate(${s}px, ${-s * 0.6}px) rotate(-2.5deg)` },
                    { transform: `translate(${-s}px, ${s * 0.3}px) rotate(2.5deg)` },
                    { transform: `translate(${s * 0.5}px, 0px) rotate(-1deg)` },
                    { transform: "translate(0px, 0px) rotate(0deg)" },
                ],
                { duration: 260, easing: "cubic-bezier(.36,.07,.19,.97)" }
            );
        }

        const size = config.emojiSize;
        for (let k = 0; k < config.burstCount; k++) {
            const el = document.createElement("span");
            el.textContent = safe[(Math.random() * safe.length) | 0];
            el.style.position = "absolute";
            el.style.left = "0px";
            el.style.top = "0px";
            el.style.fontSize = `${size}px`;
            el.style.lineHeight = "1";
            el.style.pointerEvents = "none";
            el.style.userSelect = "none";
            el.setAttribute("aria-hidden", "true");
            layer.appendChild(el);

            // มุมพุ่งขึ้นด้านบนเป็นหลัก แล้วกระจายซ้าย-ขวาแบบสุ่ม
            const ang = ((-90 + (Math.random() * 2 - 1) * config.spread) * Math.PI) / 180;
            const speed = config.power * (0.65 + Math.random() * 0.8);

            particles.push({
                el,
                x: ox - size / 2,
                y: oy - size / 2,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                rot: Math.random() * 360,
                vrot: (Math.random() * 2 - 1) * 14,
                size,
                life: 260,
            });
        }

        if (!rafId) {
            lastTs = 0;
            rafId = requestAnimationFrame(step);
        }
    }

    // ----- ผูก event ให้ปุ่ม: กดแล้วยิง burst ทันที -----
    button.addEventListener("pointerdown", burst);

    // คืนฟังก์ชัน burst ออกไป เผื่ออยากเรียกเองจากที่อื่น เช่น หลัง fetch สำเร็จ
    return burst;
}
