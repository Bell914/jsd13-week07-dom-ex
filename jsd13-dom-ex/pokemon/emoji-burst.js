// =========================================================
// Emoji Burst (เอฟเฟกต์ระเบิดอนุภาค Emoji ประจำปุ่ม)
// =========================================================

function attachEmojiBurst(button, options = {}) {
    // 1. ตั้งค่าพื้นฐานของอนุภาค Emoji
    const config = {
        emojis: options.emojis || "🎉,✨,😄,🔥,💥,⭐,💖,🤩,👍,🥳,🎊,😎",
        burstCount: options.burstCount ?? 16,
        power: options.power ?? 12,
        spread: options.spread ?? 55,
        gravity: (options.gravity ?? 4) * 0.15, // แรงโน้มถ่วงดึงลง
        emojiSize: options.emojiSize ?? 20,
        shakeIntensity: options.shakeIntensity ?? 6, // ความแรงของการสั่นปุ่ม
    };

    // 2. สร้าง Container ครอบปุ่มเพื่อใช้เป็นพื้นที่ปล่อย Emoji
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";
    container.style.overflow = "visible";

    button.parentNode.insertBefore(container, button);
    container.appendChild(button);

    // 3. เลเยอร์สำหรับวาง Emoji Particle
    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.zIndex = "3";
    layer.style.pointerEvents = "none";
    layer.style.overflow = "visible";
    container.appendChild(layer);

    button.style.position = "relative";
    button.style.zIndex = "2";

    let particles = [];
    let rafId = 0;
    let lastTs = 0;

    // 4. ลูปคำนวณการเคลื่อนที่ของ Particle แต่ละเฟรม (Physics Loop)
    function step(ts) {
        let dt = lastTs ? (ts - lastTs) / 16.6667 : 1;
        lastTs = ts;
        if (dt > 3) dt = 3;

        const H = container.clientHeight;
        const W = container.clientWidth;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.vy += config.gravity * dt; // แรงโน้มถ่วง
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vrot * dt;
            p.life -= dt;

            // ลบอนุภาคที่หมดอายุ หรือตกออกนอกหน้าจอ
            if (p.life <= 0 || p.y > H + p.size * 2.5 || p.x < -p.size * 3 || p.x > W + p.size * 3) {
                p.el.remove();
                particles.splice(i, 1);
                continue;
            }

            // ค่อยๆ จางหายตอนใกล้หมดอายุ
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

    // 5. ฟังก์ชันยิงเอฟเฟกต์ระเบิด Emoji ออกมา
    function burst() {
        const list = config.emojis.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
        const safe = list.length ? list : ["🎉"];

        // จุดศูนย์กลางของปุ่ม
        const ox = button.offsetLeft + button.offsetWidth / 2;
        const oy = button.offsetTop + button.offsetHeight / 2;

        // สั่นปุ่มเบาๆ ตอนกด
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

        // สร้างอนุภาค Emoji ตามจำนวนที่กำหนด
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

            // คำนวณมุมและทิศทางการพุ่งกระจาย
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

    // เมื่อกดปุ่มจะสั่งยิง Emoji ทันที
    button.addEventListener("pointerdown", burst);

    return burst;
}
