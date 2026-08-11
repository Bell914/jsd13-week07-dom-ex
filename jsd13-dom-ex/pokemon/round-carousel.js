/**
 * Round Carousel 3D — Vanilla JS version
 * แปลงมาจาก React component เดิม (Originkit RoundCarousel)
 *
 * คุณสมบัติ:
 * - จัดวางการ์ดเป็นวงแหวน 3 มิติ (3D Cylinder Ring) ด้วย CSS preserve-3d
 * - คำนวณรัศมี (radius) และมุมองศา (angle = 360 / count) แบบเรขาคณิตอัตโนมัติตามจำนวนการ์ด
 * - หมุนวนอัตโนมัติ (Auto-rotation) พร้อมมุมมองก้ม 3D Tilt (rotateX)
 * - รองรับการใช้เมาส์ลากหมุน (Drag & Momentum Physics) พร้อมแรงเหวี่ยงหน่วงความเร็ว
 * - รองรับการเพิ่มการ์ดโปเกมอนแบบไดนามิก (.addCard), ลบการ์ด (.removeCard), เคลียร์ (.clear)
 */

class RoundCarousel {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            console.error('RoundCarousel: Container not found');
            return;
        }

        this.options = {
            cardWidth: options.cardWidth ?? 280,
            cardHeight: options.cardHeight ?? 390,
            spacing: options.spacing ?? 3,
            speed: options.speed ?? 3, // ความเร็วหมุนอัตโนมัติ
            direction: options.direction ?? "right",
            drag: options.drag ?? true,
            sensitivity: options.sensitivity ?? 5,
            tilt: options.tilt ?? -8,
            perspective: options.perspective ?? 2600,
            cornerRadius: options.cornerRadius ?? 14,
            innerDim: options.innerDim ?? 3.5,
            autoRotate: options.autoRotate ?? true,
            onCardClick: options.onCardClick ?? null,
            onCardRemove: options.onCardRemove ?? null,
            ...options
        };

        this.items = [];
        this.cardElements = [];
        this.rotY = 0;
        this.vel = 0;
        this.lastTime = 0;
        this.isAlive = true;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragLastX = 0;
        this.dragDistance = 0;

        this.initDOM();
        this.bindEvents();
        this.start();

        if (options.items && options.items.length > 0) {
            this.setItems(options.items);
        }
    }

    initDOM() {
        this.container.classList.add('round-carousel-root');
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.minHeight = `${this.options.cardHeight + 80}px`;
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.perspective = `${this.options.perspective}px`;
        this.container.style.overflow = 'visible';
        this.container.style.cursor = this.options.drag ? 'grab' : 'default';
        this.container.style.userSelect = 'none';
        this.container.style.touchAction = 'none';

        // กรอบปรับมุมก้มเงย Tilt (rotateX)
        this.tiltWrapper = document.createElement('div');
        this.tiltWrapper.className = 'round-carousel-tilt';
        this.tiltWrapper.style.transformStyle = 'preserve-3d';
        this.tiltWrapper.style.transform = `rotateX(${this.options.tilt}deg)`;
        this.tiltWrapper.style.display = 'flex';
        this.tiltWrapper.style.alignItems = 'center';
        this.tiltWrapper.style.justifyContent = 'center';

        // วงแหวน 3D Ring สำหรับหมุนรอบแกน Y
        this.ring = document.createElement('div');
        this.ring.className = 'round-carousel-ring';
        this.ring.style.position = 'relative';
        this.ring.style.width = `${this.options.cardWidth}px`;
        this.ring.style.height = `${this.options.cardHeight}px`;
        this.ring.style.transformStyle = 'preserve-3d';

        this.tiltWrapper.appendChild(this.ring);
        this.container.innerHTML = '';
        this.container.appendChild(this.tiltWrapper);

        // ปุ่มลูกศรหมุนซ้าย-ขวา
        this.createNavButtons();
    }

    createNavButtons() {
        this.navPrev = document.createElement('button');
        this.navPrev.className = 'carousel-nav-btn carousel-nav-prev';
        this.navPrev.innerHTML = '◀';
        this.navPrev.setAttribute('aria-label', 'Rotate Left');

        this.navNext = document.createElement('button');
        this.navNext.className = 'carousel-nav-btn carousel-nav-next';
        this.navNext.innerHTML = '▶';
        this.navNext.setAttribute('aria-label', 'Rotate Right');

        this.container.appendChild(this.navPrev);
        this.container.appendChild(this.navNext);

        this.navPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.step(1);
        });

        this.navNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.step(-1);
        });

        this.updateNavVisibility();
    }

    updateNavVisibility() {
        const hasMultiple = this.items.length > 1;
        if (this.navPrev) this.navPrev.style.display = hasMultiple ? 'flex' : 'none';
        if (this.navNext) this.navNext.style.display = hasMultiple ? 'flex' : 'none';
    }

    /**
     * คำนวณรัศมีวงแหวน 3D Ring ตามจำนวนการ์ด
     */
    calculateGeometry() {
        const count = Math.max(1, this.items.length);
        this.angleStep = 360 / count;
        const factor = 1 + this.options.spacing * 0.15;

        if (count === 1) {
            this.radius = 0;
        } else if (count === 2) {
            this.radius = (this.options.cardWidth * factor) / 2;
        } else {
            this.radius = (this.options.cardWidth * factor) / (2 * Math.tan(Math.PI / count));
        }
    }

    bindEvents() {
        if (!this.options.drag) return;

        const onPointerDown = (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragLastX = e.clientX;
            this.dragDistance = 0;
            this.vel = 0;
            this.container.style.cursor = 'grabbing';
            try {
                this.container.setPointerCapture?.(e.pointerId);
            } catch (_) {}
        };

        const onPointerMove = (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.dragLastX;
            this.dragLastX = e.clientX;
            this.dragDistance += Math.abs(dx);

            const k = 0.25 * this.options.sensitivity;
            this.rotY += dx * k;
            this.vel = dx * k * 60;
        };

        const onPointerUp = (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.container.style.cursor = 'grab';
            try {
                this.container.releasePointerCapture?.(e.pointerId);
            } catch (_) {}
        };

        this.container.addEventListener('pointerdown', onPointerDown);
        this.container.addEventListener('pointermove', onPointerMove);
        this.container.addEventListener('pointerup', onPointerUp);
        this.container.addEventListener('pointercancel', onPointerUp);

        // Keyboard arrow navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.step(-1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.step(1);
            }
        });
    }

    /**
     * หมุนไปยังการ์ดถัดไปหรือก่อนหน้า
     */
    step(dir) {
        if (this.items.length <= 1) return;
        const targetRot = this.rotY + dir * this.angleStep;
        this.rotY = Math.round(targetRot / this.angleStep) * this.angleStep;
        this.vel = 0;
    }

    /**
     * หมุนให้การ์ด index นั้นๆ หันมาด้านหน้าตรงๆ
     */
    rotateTo(index) {
        if (index < 0 || index >= this.items.length) return;
        this.rotY = -index * this.angleStep;
        this.vel = 0;
    }

    createCardFace(item, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'round-carousel-slot';
        wrapper.setAttribute('data-index', String(index));
        wrapper.style.position = 'absolute';
        wrapper.style.inset = '0';
        wrapper.style.transformStyle = 'preserve-3d';

        // ด้านหน้าการ์ด (Front Face)
        const front = document.createElement('div');
        front.className = 'round-carousel-face round-carousel-front';
        front.style.position = 'absolute';
        front.style.inset = '0';
        front.style.borderRadius = `${this.options.cornerRadius}px`;
        front.style.overflow = 'hidden';
        front.style.backfaceVisibility = 'hidden';
        front.style.backgroundColor = '#ffffff';
        front.style.border = '4px solid #1a1a2e';
        front.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
        front.style.boxSizing = 'border-box';
        front.style.padding = '16px';
        front.style.display = 'flex';
        front.style.flexDirection = 'column';
        front.style.alignItems = 'center';
        front.style.justifyContent = 'space-between';

        if (item.customElement) {
            front.appendChild(item.customElement);
        } else if (item.src) {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.title || '';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            front.appendChild(img);
        }

        // ปุ่มลบการ์ด
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'round-carousel-delete';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'ลบการ์ดนี้';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentIdx = this.cardElements.indexOf(wrapper);
            if (currentIdx !== -1) {
                this.removeCard(currentIdx);
            }
        });
        front.appendChild(deleteBtn);

        // ด้านหลังการ์ด (Back Face สไตล์หลังการ์ด PokeBall)
        const back = document.createElement('div');
        back.className = 'round-carousel-face round-carousel-back';
        back.style.position = 'absolute';
        back.style.inset = '0';
        back.style.borderRadius = `${this.options.cornerRadius}px`;
        back.style.overflow = 'hidden';
        back.style.transform = 'rotateY(180deg)';
        back.style.backfaceVisibility = 'hidden';
        back.style.backgroundColor = '#0e1626';
        back.style.border = '4px solid #1a1a2e';
        back.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
        back.style.boxSizing = 'border-box';
        back.style.display = 'flex';
        back.style.alignItems = 'center';
        back.style.justifyContent = 'center';

        const pokeballIcon = document.createElement('div');
        pokeballIcon.className = 'card-back-pokeball';
        back.appendChild(pokeballIcon);

        wrapper.appendChild(front);
        wrapper.appendChild(back);

        // คลิกที่การ์ดเพื่อหมุนมาข้างหน้า หรือทำแอ็กชัน
        wrapper.addEventListener('click', (e) => {
            if (this.dragDistance > 6) return; // หากเป็นการลาก จะไม่นับเป็นคลิก
            const currentIdx = this.cardElements.indexOf(wrapper);
            if (currentIdx !== -1) {
                this.rotateTo(currentIdx);
                if (typeof this.options.onCardClick === 'function') {
                    this.options.onCardClick(this.items[currentIdx], currentIdx, wrapper);
                }
            }
        });

        return wrapper;
    }

    updatePositions() {
        this.calculateGeometry();

        this.cardElements.forEach((slot, i) => {
            const rot = i * this.angleStep;
            slot.style.transform = `rotateY(${rot}deg) translateZ(${this.radius}px)`;
        });

        this.updateNavVisibility();
    }

    setItems(items) {
        this.items = [...items];
        this.ring.innerHTML = '';
        this.cardElements = [];

        this.items.forEach((item, i) => {
            const slot = this.createCardFace(item, i);
            this.ring.appendChild(slot);
            this.cardElements.push(slot);
        });

        this.updatePositions();
    }

    addCard(item, focus = true) {
        this.items.push(item);
        const newIndex = this.items.length - 1;
        const slot = this.createCardFace(item, newIndex);
        this.ring.appendChild(slot);
        this.cardElements.push(slot);

        this.updatePositions();

        if (focus) {
            this.rotateTo(newIndex);
        }
    }

    removeCard(index) {
        if (index < 0 || index >= this.items.length) return;
        const removed = this.items.splice(index, 1)[0];
        const slot = this.cardElements.splice(index, 1)[0];
        if (slot) slot.remove();

        this.updatePositions();

        if (typeof this.options.onCardRemove === 'function') {
            this.options.onCardRemove(removed, index);
        }
    }

    clear() {
        this.items = [];
        this.cardElements = [];
        this.ring.innerHTML = '';
        this.rotY = 0;
        this.vel = 0;
        this.updateNavVisibility();
    }

    start() {
        this.isAlive = true;
        this.lastTime = 0;

        const degPerSec = this.options.speed * 6 * (this.options.direction === "left" ? -1 : 1);

        const draw = (now) => {
            if (!this.isAlive) return;

            const dt = this.lastTime ? (now - this.lastTime) / 1000 : 0;
            this.lastTime = now;
            const f = Math.min(dt, 0.1);

            if (!this.isDragging) {
                if (Math.abs(this.vel) > 0.01) {
                    this.rotY += this.vel * f;
                    this.vel *= 0.94; // แรงหน่วงความเร็วหลังปล่อยมือ
                } else if (this.options.autoRotate && this.items.length > 1) {
                    this.rotY += degPerSec * f;
                }
            }

            if (this.ring) {
                this.ring.style.transform = `translateZ(${-this.radius}px) rotateY(${this.rotY}deg)`;
            }

            this.rafId = requestAnimationFrame(draw);
        };

        this.rafId = requestAnimationFrame(draw);
    }

    destroy() {
        this.isAlive = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }
}

// Global helper function
function attachRoundCarousel(container, options = {}) {
    return new RoundCarousel(container, options);
}
