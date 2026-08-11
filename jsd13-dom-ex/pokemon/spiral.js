/**
 * Spiral Images Vortex — Vanilla JS version
 * แปลงมาจาก React component เดิม (Originkit SpiralImages)
 *
 * หลักการทำงาน:
 * - คำนวณทางเดินวนก้นหอยแบบ Archimedean spiral จากขอบนอกม้วนเข้าสู่จุดศูนย์กลาง
 * - Arc-length reparameterization: จัดระยะห่างระหว่างการ์ดตามความยาวส่วนโค้งจริง ทำให้การ์ดกระจายตัวสม่ำเสมอสวยงาม
 * - ปรับขนาดอัตโนมัติตามระยะห่าง (Size attenuation) และหมุนตามมุมสัมผัส (Tangent rotation)
 * - Render บน HTML5 Canvas 2D ที่ 60fps ลื่นไหล ไม่มีกระตุก
 */

const TWO_PI = Math.PI * 2;

class SpiralImages {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            console.error('SpiralImages: Container not found');
            return;
        }

        this.options = {
            images: options.images || [],
            turns: options.turns ?? 3.5,
            speed: options.speed ?? 2.2,
            spacing: options.spacing ?? 5,
            spread: options.spread ?? 6,
            sizeAttenuation: options.sizeAttenuation ?? 2,
            imageSize: options.imageSize ?? 180,
            fadeIn: options.fadeIn ?? 20,
            fadeOut: options.fadeOut ?? 0,
            cornerRadius: options.cornerRadius ?? 8,
            cardBgColor: options.cardBgColor ?? 'rgba(255, 255, 255, 0.95)',
            ...options
        };

        this.rafId = 0;
        this.progress = 0;
        this.lastTime = 0;
        this.isAlive = true;
        this.isPaused = false;
        this.imageElements = [];

        this.initCanvas();
        this.buildArcTable();
        this.loadImages();
        this.start();
    }

    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'spiral-canvas';
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
    }

    loadImages() {
        const list = this.options.images && this.options.images.length > 0
            ? this.options.images
            : [];

        this.imageElements = list.map((item) => {
            const src = typeof item === 'string' ? item : item?.src;
            if (!src) return null;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            return img;
        });
    }

    setImages(images) {
        this.options.images = images;
        this.loadImages();
    }

    /**
     * Archimedean spiral: n in [0, 1] -> outer (n=0) to center (n=1)
     */
    spiral(n, R) {
        const ang = n * this.options.turns * TWO_PI;
        const rad = R * (1 - n);
        return {
            x: rad * Math.cos(ang),
            y: -rad * Math.sin(ang)
        };
    }

    /**
     * สร้างตาราง Arc-length reparameterization เพื่อให้การ์ดเรียงตัวมีระยะห่างสม่ำเสมอ
     */
    buildArcTable() {
        const M = 2000;
        this.cum = new Float32Array(M + 1);
        let prev = this.spiral(0, 1);
        for (let k = 1; k <= M; k++) {
            const pt = this.spiral(k / M, 1);
            const dx = pt.x - prev.x;
            const dy = pt.y - prev.y;
            this.cum[k] = this.cum[k - 1] + Math.sqrt(dx * dx + dy * dy);
            prev = pt;
        }

        const total = this.cum[M] || 1;
        const K = 1024;
        this.K = K;
        this.nForArc = new Float32Array(K + 1);
        let j = 0;
        for (let a = 0; a <= K; a++) {
            const target = (a / K) * total;
            while (j < M && this.cum[j + 1] < target) j++;
            const seg = this.cum[j + 1] - this.cum[j];
            const f2 = seg > 0 ? (target - this.cum[j]) / seg : 0;
            this.nForArc[a] = (j + f2) / M;
        }
    }

    arcToN(s) {
        const x = Math.max(0, Math.min(this.K, s * this.K));
        const i = Math.floor(x);
        const a = this.nForArc[i];
        const b = this.nForArc[Math.min(i + 1, this.K)];
        return a + (b - a) * (x - i);
    }

    roundRect(ctx, x, y, rw, rh, r) {
        const rr = Math.min(r, rw / 2, rh / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + rw, y, x + rw, y + rh, rr);
        ctx.arcTo(x + rw, y + rh, x, y + rh, rr);
        ctx.arcTo(x, y + rh, x, y, rr);
        ctx.arcTo(x, y, x + rw, y, rr);
        ctx.closePath();
    }

    measure() {
        if (!this.canvas || !this.container) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        this.dpr = dpr;
        this.width = this.container.clientWidth || window.innerWidth || 800;
        this.height = this.container.clientHeight || window.innerHeight || 800;

        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
    }

    draw(now) {
        if (!this.ctx || !this.isAlive) return;

        const dt = this.lastTime ? (now - this.lastTime) / 1000 : 0;
        this.lastTime = now;
        const f = Math.min(dt, 0.1);

        if (!this.isPaused) {
            this.progress = (this.progress + this.options.speed * f) % 100;
        }

        const L = this.progress;
        const w = this.width;
        const h = this.height;
        const dpr = this.dpr || 1;
        const ctx = this.ctx;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const R = 0.48 * Math.min(w, h) * (1 + (this.options.spread - 1) * 0.18);
        const els = this.imageElements;
        const nImgs = els.length || 1;

        const stepFrac = Math.max(0.005, (this.options.spacing * 0.5) / 100);
        const slots = Math.min(400, Math.ceil(1 / stepFrac) + 2);
        const base = L / 100;

        const cards = [];
        for (let i = 0; i < slots; i++) {
            const s = (((base + i * stepFrac) % 1) + 1) % 1;
            const n = this.arcToN(s);
            cards.push({ tt: s * 100, n, img: i % nImgs });
        }
        cards.sort((a, b) => a.n - b.n);

        for (let k = 0; k < cards.length; k++) {
            const { tt, n, img: imgIdx } = cards[k];
            const p = this.spiral(n, R);
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);

            let opacity = 1;
            if (tt < this.options.fadeIn) {
                opacity = tt / this.options.fadeIn;
            } else if (tt > 100 - this.options.fadeOut) {
                opacity = (100 - tt) / this.options.fadeOut;
            }
            if (opacity < 0.01) continue;

            const scale = this.options.sizeAttenuation > 0
                ? Math.pow(Math.min(dist / R, 1), this.options.sizeAttenuation * 0.5)
                : 1;

            const p2 = this.spiral(Math.min(n + 0.001, 1), R);
            const angle = Math.atan2(p2.y - p.y, p2.x - p.x);

            const el = els[imgIdx];
            const ready = el && el.complete && el.naturalWidth > 0;
            const aspect = ready ? el.naturalWidth / el.naturalHeight : 1;

            let cw = this.options.imageSize * scale;
            let ch = cw / aspect;
            if (aspect < 1) {
                ch = this.options.imageSize * scale;
                cw = ch * aspect;
            }

            const x = cx + p.x;
            const y = cy + p.y;
            const rad = (this.options.cornerRadius / 20) * (Math.min(cw, ch) / 2);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.globalAlpha = opacity;

            // เงาของการ์ด
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 12 * scale;
            ctx.shadowOffsetX = 4 * scale;
            ctx.shadowOffsetY = 6 * scale;

            // กรอบการ์ดสไตล์การ์ดโปเกมอน
            this.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, rad);
            ctx.fillStyle = this.options.cardBgColor;
            ctx.fill();

            // เส้นขอบการ์ด
            ctx.lineWidth = Math.max(1, 2.5 * scale);
            ctx.strokeStyle = '#1a1a2e';
            ctx.stroke();

            // คลิปและวาดรูปโปเกมอน
            ctx.shadowColor = 'transparent';
            this.roundRect(ctx, -cw / 2 + 2 * scale, -ch / 2 + 2 * scale, cw - 4 * scale, ch - 4 * scale, Math.max(0, rad - 2));
            ctx.clip();

            if (ready) {
                ctx.drawImage(el, -cw / 2 + 4 * scale, -ch / 2 + 4 * scale, cw - 8 * scale, ch - 8 * scale);
            } else {
                ctx.fillStyle = `hsl(${(imgIdx * 360) / nImgs}, 65%, 60%)`;
                ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
            }

            ctx.restore();
        }

        if (this.isAlive && !this.isPaused) {
            this.rafId = requestAnimationFrame((t) => this.draw(t));
        }
    }

    start() {
        this.isAlive = true;
        this.isPaused = false;
        this.measure();

        if (typeof ResizeObserver !== 'undefined') {
            this.ro = new ResizeObserver(() => {
                this.measure();
            });
            this.ro.observe(this.container);
        }

        this.lastTime = 0;
        this.rafId = requestAnimationFrame((t) => this.draw(t));
    }

    pause() {
        this.isPaused = true;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.lastTime = 0;
            this.rafId = requestAnimationFrame((t) => this.draw(t));
        }
    }

    destroy() {
        this.isAlive = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.ro) this.ro.disconnect();
    }
}

// Global helper function
function attachSpiralImages(container, options = {}) {
    return new SpiralImages(container, options);
}
