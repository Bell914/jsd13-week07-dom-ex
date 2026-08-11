/**
 * Coverflow Gallery — Vanilla JS version (Originkit Smooth3DSlideshow)
 * แปลงมาจาก React/Framer component เดิม (Smooth 3D Slideshow / Coverflow Gallery)
 *
 * หลักการแปลง React → Vanilla JS:
 * - useState / useEffect         → จัดการ state (active index, list) ภายใน Object/Class และ render ผ่าน DOM โดยตรง
 * - useRef(lockRef)              → ใช้ตัวแปร boolean เพื่อป้องกัน rapid clicks ซ้อนกันระหว่างกำลัง animate
 * - useCallback / event handlers → ผูก event listeners (click, keydown, touch/drag) เข้ากับ DOM elements
 * - Framer CSS Transition        → แปลง cubic-bezier array เป็น CSS transition string
 * - preserve-3d / perspective    → ใช้ CSS 3D transforms (translateX, translateZ, rotateY, rotateZ, scale)
 */

class CoverflowGallery {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            console.error('CoverflowGallery: Container not found');
            return;
        }

        // ตั้งค่าตัวแปรเริ่มต้น (เทียบเท่า COMPONENT_DEFAULTS + Props)
        this.options = {
            cardWidth: options.cardWidth ?? 300,
            cardHeight: options.cardHeight ?? 380,
            radius: options.radius ?? 4,
            tilt: options.tilt ?? 12,
            sideTilt: options.sideTilt ?? 6,
            gap: options.gap ?? 7,
            opacity: options.opacity ?? 60,
            perspective: options.perspective ?? 1600,
            scaleStep: options.scaleStep ?? 0.16,
            depth: options.depth ?? 240,
            maxVisible: options.maxVisible ?? 2,
            loop: options.loop ?? true,
            autoplay: options.autoplay ?? false,
            autoplayDirection: options.autoplayDirection ?? "rightToLeft",
            autoplayDelay: options.autoplayDelay ?? 2.5,
            transitionDuration: options.transitionDuration ?? 0.6,
            transitionEase: options.transitionEase ?? "cubic-bezier(0.22, 1, 0.36, 1)",
            showTitle: options.showTitle ?? true,
            titlePosition: options.titlePosition ?? "bottomLeft",
            titleColor: options.titleColor ?? "#ffffff",
            onCardClick: options.onCardClick ?? null,
            onCardRemove: options.onCardRemove ?? null,
            ...options
        };

        this.slides = [];
        this.cardElements = [];
        this.active = 0;
        this.isLocked = false;
        this.autoplayTimer = null;

        this.initDOM();
        this.bindEvents();

        if (options.slides && options.slides.length > 0) {
            this.setSlides(options.slides);
        }
    }

    /**
     * สร้างโครงสร้าง DOM สำหรับ 3D Stage
     */
    initDOM() {
        this.container.classList.add('coverflow-root');
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.minHeight = `${this.options.cardHeight + 60}px`;
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.perspective = `${this.options.perspective}px`;
        this.container.style.overflow = 'visible';
        this.container.style.outline = 'none';
        this.container.tabIndex = 0;

        // Stage ภายในที่มี preserve-3d
        this.stage = document.createElement('div');
        this.stage.classList.add('coverflow-stage');
        this.stage.style.position = 'relative';
        this.stage.style.width = `${this.options.cardWidth}px`;
        this.stage.style.height = `${this.options.cardHeight}px`;
        this.stage.style.transformStyle = 'preserve-3d';

        this.container.innerHTML = '';
        this.container.appendChild(this.stage);

        // สร้างปุ่มลูกศรนำทาง ซ้าย/ขวา
        this.createNavButtons();
    }

    createNavButtons() {
        this.navPrev = document.createElement('button');
        this.navPrev.className = 'coverflow-nav coverflow-prev';
        this.navPrev.innerHTML = '◀';
        this.navPrev.setAttribute('aria-label', 'Previous Slide');

        this.navNext = document.createElement('button');
        this.navNext.className = 'coverflow-nav coverflow-next';
        this.navNext.innerHTML = '▶';
        this.navNext.setAttribute('aria-label', 'Next Slide');

        this.container.appendChild(this.navPrev);
        this.container.appendChild(this.navNext);

        this.navPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.step(-1);
        });

        this.navNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.step(1);
        });

        this.updateNavVisibility();
    }

    updateNavVisibility() {
        const hasMultiple = this.slides.length > 1;
        if (this.navPrev) this.navPrev.style.display = hasMultiple ? 'flex' : 'none';
        if (this.navNext) this.navNext.style.display = hasMultiple ? 'flex' : 'none';
    }

    /**
     * ผูก Keyboard Event (ลูกศรซ้าย-ขวา) และ Touch/Drag
     */
    bindEvents() {
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.step(1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.step(-1);
            }
        });

        // รองรับ Touch Swipe
        let touchStartX = 0;
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 40) {
                if (diff < 0) this.step(1);
                else this.step(-1);
            }
        }, { passive: true });
    }

    /**
     * ล็อคการกดรัวๆ ขณะกำลังหมุนเปลี่ยนการ์ด
     */
    lock() {
        this.isLocked = true;
        const durMs = Math.max(50, this.options.transitionDuration * 1000);
        window.setTimeout(() => {
            this.isLocked = false;
        }, durMs);
    }

    /**
     * เลื่อนไปหน้า/หลัง ตามทิศทาง dir (-1 หรือ 1)
     */
    step(dir) {
        const n = this.slides.length;
        if (n <= 1 || this.isLocked) return;
        this.lock();
        this.active = (((this.active + dir) % n) + n) % n;
        this.updatePositions();
    }

    /**
     * กำหนดการ์ดที่ต้องการให้โฟกัสตรงกลาง
     */
    goTo(index) {
        const n = this.slides.length;
        if (n === 0 || this.isLocked) return;
        this.lock();
        this.active = Math.max(0, Math.min(n - 1, index));
        this.updatePositions();
    }

    /**
     * คำนวณรัศมีความโค้งของมุมการ์ด (scale 0-20)
     */
    getEffectiveRadius() {
        const r = Math.max(0, Math.min(20, this.options.radius));
        const minSide = Math.min(this.options.cardWidth, this.options.cardHeight);
        return (r / 20) * (minSide / 2);
    }

    /**
     * สร้าง Element ของการ์ด 1 ใบ
     */
    createCardElement(slide, index) {
        const card = document.createElement('div');
        card.className = 'coverflow-card';
        card.setAttribute('data-index', String(index));
        card.setAttribute('role', 'group');
        card.setAttribute('aria-label', slide.title || `Card ${index + 1}`);

        const radiusPx = this.getEffectiveRadius();

        card.style.position = 'absolute';
        card.style.left = '50%';
        card.style.top = '50%';
        card.style.width = `${this.options.cardWidth}px`;
        card.style.height = `${this.options.cardHeight}px`;
        card.style.borderRadius = `${radiusPx}px`;
        card.style.overflow = 'hidden';
        card.style.transformStyle = 'preserve-3d';
        card.style.transformOrigin = 'center center';
        card.style.backgroundColor = '#ffffff';
        card.style.border = '3px solid #1a1a2e';
        card.style.boxShadow = '0 12px 28px rgba(0,0,0,0.35)';
        card.style.willChange = 'transform, opacity';
        card.style.transition = `transform ${this.options.transitionDuration}s ${this.options.transitionEase}, opacity ${this.options.transitionDuration}s ${this.options.transitionEase}`;

        // หากมีการส่ง custom element / HTML มา
        if (slide.customElement) {
            card.appendChild(slide.customElement);
        } else if (slide.html) {
            const content = document.createElement('div');
            content.className = 'coverflow-custom-content';
            content.innerHTML = slide.html;
            card.appendChild(content);
        } else {
            // โหมดมาตรฐาน: รูปภาพ + หัวข้อ
            if (slide.image && slide.image.src) {
                const img = document.createElement('img');
                img.src = slide.image.src;
                img.alt = slide.image.alt || slide.title || '';
                img.draggable = false;
                img.style.position = 'absolute';
                img.style.inset = '0';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.userSelect = 'none';
                card.appendChild(img);
            }

            if (this.options.showTitle && slide.title) {
                const gradient = document.createElement('div');
                gradient.style.position = 'absolute';
                gradient.style.inset = '0';
                gradient.style.background = 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)';
                gradient.style.pointerEvents = 'none';
                card.appendChild(gradient);

                const titleBox = document.createElement('div');
                titleBox.style.position = 'absolute';
                titleBox.style.left = '16px';
                titleBox.style.right = '16px';
                titleBox.style.bottom = '16px';
                titleBox.style.pointerEvents = 'none';

                const titleSpan = document.createElement('span');
                titleSpan.textContent = slide.title;
                titleSpan.style.color = this.options.titleColor;
                titleSpan.style.fontSize = '18px';
                titleSpan.style.fontWeight = '700';
                titleSpan.style.lineHeight = '1.2em';
                titleSpan.style.whiteSpace = 'pre-line';
                titleSpan.style.textShadow = '0 2px 8px rgba(0,0,0,0.6)';

                titleBox.appendChild(titleSpan);
                card.appendChild(titleBox);
            }
        }

        // ปุ่มลบการ์ด (Delete button ที่มุมขวาบน)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'coverflow-card-delete';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'ลบการ์ดนี้';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = this.cardElements.indexOf(card);
            if (idx !== -1) {
                this.removeSlide(idx);
            }
        });
        card.appendChild(deleteBtn);

        // แผ่นฟิล์ม Dim Overlay สำหรับทำให้การ์ดที่ไม่ได้เลือกมืดลง
        const dimOverlay = document.createElement('div');
        dimOverlay.className = 'coverflow-dim-overlay';
        dimOverlay.style.position = 'absolute';
        dimOverlay.style.inset = '0';
        dimOverlay.style.background = '#000000';
        dimOverlay.style.pointerEvents = 'none';
        dimOverlay.style.transition = `opacity ${this.options.transitionDuration}s ${this.options.transitionEase}`;
        card.appendChild(dimOverlay);

        // คลิกที่การ์ด: ถ้าเป็นการ์ดข้างๆ จะหมุนมาตรงกลาง, ถ้าเป็นการ์ดตรงกลางจะเรียก callback
        card.addEventListener('click', () => {
            if (this.isLocked) return;
            const currentIdx = this.cardElements.indexOf(card);
            if (currentIdx === -1) return;

            if (currentIdx === this.active) {
                if (typeof this.options.onCardClick === 'function') {
                    this.options.onCardClick(this.slides[currentIdx], currentIdx);
                }
            } else {
                this.goTo(currentIdx);
            }
        });

        return card;
    }

    /**
     * คำนวณตำแหน่ง 3D Transforms ของการ์ดทุกใบ
     */
    updatePositions() {
        const n = this.slides.length;
        const dimVal = 1 - Math.max(0, Math.min(100, this.options.opacity)) / 100;
        const shouldLoop = this.options.loop && n > 2;

        this.cardElements.forEach((card, i) => {
            let rel = i - this.active;

            if (shouldLoop) {
                if (rel > n / 2) rel -= n;
                if (rel < -n / 2) rel += n;
            }

            const ax = Math.abs(rel);
            const visible = ax <= this.options.maxVisible;
            const isActive = rel === 0;

            const sc = Math.max(0.4, 1 - ax * this.options.scaleStep);
            const tx = rel * (this.options.gap * 30);
            const tz = -ax * this.options.depth;
            const ry = -rel * this.options.tilt;
            const rz = rel * this.options.sideTilt;

            card.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`;
            card.style.opacity = visible ? '1' : '0';
            card.style.cursor = isActive ? 'default' : 'pointer';
            card.style.pointerEvents = visible ? 'auto' : 'none';
            card.style.zIndex = String(100 - Math.round(ax * 10));

            const dimOverlay = card.querySelector('.coverflow-dim-overlay');
            if (dimOverlay) {
                dimOverlay.style.opacity = isActive ? '0' : String(dimVal);
            }

            if (isActive) {
                card.classList.add('is-active');
            } else {
                card.classList.remove('is-active');
            }
        });

        this.updateNavVisibility();
    }

    /**
     * กำหนดรายการ Slide ทั้งหมดใหม่
     */
    setSlides(slides) {
        this.slides = [...slides];
        this.stage.innerHTML = '';
        this.cardElements = [];

        this.slides.forEach((slide, i) => {
            const cardEl = this.createCardElement(slide, i);
            this.stage.appendChild(cardEl);
            this.cardElements.push(cardEl);
        });

        this.active = Math.max(0, Math.min(this.slides.length - 1, this.active));
        this.updatePositions();
        this.restartAutoplay();
    }

    /**
     * เพิ่ม Slide ใหม่ 1 ใบเข้าสู่ Coverflow
     */
    addSlide(slide, focus = true) {
        this.slides.push(slide);
        const newIndex = this.slides.length - 1;
        const cardEl = this.createCardElement(slide, newIndex);
        this.stage.appendChild(cardEl);
        this.cardElements.push(cardEl);

        if (focus) {
            this.active = newIndex;
        }

        this.updatePositions();
        this.restartAutoplay();
    }

    /**
     * ลบ Slide ตาม index
     */
    removeSlide(index) {
        if (index < 0 || index >= this.slides.length) return;
        const removed = this.slides.splice(index, 1)[0];
        const cardEl = this.cardElements.splice(index, 1)[0];
        if (cardEl) cardEl.remove();

        if (this.active >= this.slides.length) {
            this.active = Math.max(0, this.slides.length - 1);
        }

        this.updatePositions();

        if (typeof this.options.onCardRemove === 'function') {
            this.options.onCardRemove(removed, index);
        }

        this.restartAutoplay();
    }

    /**
     * เคลียร์ Slide ทั้งหมด
     */
    clear() {
        this.slides = [];
        this.cardElements = [];
        this.stage.innerHTML = '';
        this.active = 0;
        this.updateNavVisibility();
        this.stopAutoplay();
    }

    /**
     * ระบบ Autoplay
     */
    startAutoplay() {
        if (!this.options.autoplay || this.slides.length < 2) return;
        this.stopAutoplay();
        const ms = Math.max(0.3, this.options.autoplayDelay) * 1000;
        const dir = this.options.autoplayDirection === "leftToRight" ? -1 : 1;
        this.autoplayTimer = window.setInterval(() => {
            this.step(dir);
        }, ms);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            window.clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    restartAutoplay() {
        this.stopAutoplay();
        if (this.options.autoplay) {
            this.startAutoplay();
        }
    }
}

// Global helper function สำหรับเรียกใช้ง่ายๆ
function attachCoverflow(container, options = {}) {
    return new CoverflowGallery(container, options);
}
