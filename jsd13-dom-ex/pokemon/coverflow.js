/**
 * Coverflow Gallery (Smooth3DSlideshow) — Vanilla JS
 * Recreated accurately from Originkit Smooth3DSlideshow React component
 */

const COMPONENT_DEFAULTS = {
    cardWidth: 280,
    cardHeight: 400,
    radius: 4,
    tilt: 12,
    sideTilt: 8,
    gap: 8,
    opacity: 65,
    autoplay: false,
    autoplayDirection: "rightToLeft",
    transition: {
        duration: 0.6,
        delay: 2.5,
        ease: [0.22, 1, 0.36, 1],
    },
    showTitle: false,
    titleColor: "#ffffff",
};

const PERSPECTIVE = 1600;
const SCALE_STEP = 0.16;
const MAX_VISIBLE = 2;
const DEPTH = 240;

function cssTransition(t) {
    const dur = t && typeof t.duration === "number" ? t.duration : 0.6;
    let ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    const e = t?.ease;
    if (Array.isArray(e) && e.length === 4) {
        ease = `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`;
    } else if (typeof e === "string") {
        const map = {
            linear: "linear",
            easeIn: "ease-in",
            easeOut: "ease-out",
            easeInOut: "ease-in-out",
        };
        ease = map[e] || "ease";
    }
    return { dur, ease };
}

class CoverflowGallery {
    constructor(container, props = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            console.error('CoverflowGallery: Container not found');
            return;
        }

        this.options = { ...COMPONENT_DEFAULTS, ...props };
        if (props.transition) {
            this.options.transition = { ...COMPONENT_DEFAULTS.transition, ...props.transition };
        }

        this.slides = [];
        this.cardElements = [];
        this.active = 0;
        this.isLocked = false;
        this.autoplayTimer = null;

        const { dur, ease } = cssTransition(this.options.transition);
        this.dur = dur;
        this.ease = ease;
        this.transitionCss = `transform ${dur}s ${ease}, opacity ${dur}s ${ease}`;

        this.initDOM();
        this.bindEvents();

        if (props.slides && props.slides.length > 0) {
            this.setSlides(props.slides);
        }
    }

    initDOM() {
        this.container.classList.add('coverflow-root');
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.minHeight = `${this.options.cardHeight + 60}px`;
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.perspective = `${PERSPECTIVE}px`;
        this.container.style.overflow = 'visible';
        this.container.style.outline = 'none';
        this.container.setAttribute('tabindex', '0');
        this.container.setAttribute('role', 'group');
        this.container.setAttribute('aria-roledescription', 'carousel');

        this.stage = document.createElement('div');
        this.stage.className = 'coverflow-stage';
        this.stage.style.position = 'relative';
        this.stage.style.width = `${this.options.cardWidth}px`;
        this.stage.style.height = `${this.options.cardHeight}px`;
        this.stage.style.transformStyle = 'preserve-3d';

        this.container.innerHTML = '';
        this.container.appendChild(this.stage);

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

    lock() {
        this.isLocked = true;
        const durMs = Math.max(50, this.dur * 1000);
        window.setTimeout(() => {
            this.isLocked = false;
        }, durMs);
    }

    step(dir) {
        const n = this.slides.length;
        if (n <= 1 || this.isLocked) return;
        this.lock();
        this.active = (((this.active + dir) % n) + n) % n;
        this.updatePositions();
    }

    goTo(index) {
        const n = this.slides.length;
        if (n === 0 || this.isLocked) return;
        this.lock();
        this.active = Math.max(0, Math.min(n - 1, index));
        this.updatePositions();
    }

    getEffectiveRadius() {
        const r = Math.max(0, Math.min(20, this.options.radius));
        const minSide = Math.min(this.options.cardWidth, this.options.cardHeight);
        return (r / 20) * (minSide / 2);
    }

    createCardElement(slide, index) {
        const card = document.createElement('div');
        card.className = 'coverflow-card';
        card.setAttribute('data-index', String(index));
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
        card.style.border = '4px solid #1a1a2e';
        card.style.boxShadow = '8px 8px 0px rgba(0,0,0,0.35)';
        card.style.boxSizing = 'border-box';
        card.style.padding = '16px';
        card.style.willChange = 'transform, opacity';
        card.style.transition = this.transitionCss;

        if (slide.customElement) {
            card.appendChild(slide.customElement);
        } else if (slide.image && slide.image.src) {
            const img = document.createElement('img');
            img.src = slide.image.src;
            img.alt = slide.image.alt || slide.title || '';
            img.draggable = false;
            img.style.position = 'absolute';
            img.style.inset = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';
            img.style.userSelect = 'none';
            card.appendChild(img);
        }

        // ปุ่มลบการ์ด
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

        // แผ่นฟิล์ม Dim Overlay สำหรับทำให้การ์ดข้างๆ มืดลง
        const dimOverlay = document.createElement('div');
        dimOverlay.className = 'coverflow-dim-overlay';
        dimOverlay.style.position = 'absolute';
        dimOverlay.style.inset = '0';
        dimOverlay.style.background = '#000000';
        dimOverlay.style.pointerEvents = 'none';
        dimOverlay.style.transition = `opacity ${this.dur}s ${this.ease}`;
        card.appendChild(dimOverlay);

        // คลิกที่การ์ด: ถ้าเป็นการ์ดใบเดิม จะหมุนไปใบถัดไป ((active + 1) % n), ถ้าเป็นการ์ดใบอื่นจะหมุนใบนั้นมาตรงกลาง
        card.addEventListener('click', () => {
            if (this.isLocked || this.options.autoplay) return;
            const currentIdx = this.cardElements.indexOf(card);
            if (currentIdx === -1) return;

            const n = this.slides.length;
            this.lock();
            if (currentIdx === this.active) {
                if (typeof this.options.onCardClick === 'function') {
                    this.options.onCardClick(this.slides[currentIdx], currentIdx);
                } else {
                    this.active = (this.active + 1) % n;
                    this.updatePositions();
                }
            } else {
                this.active = currentIdx;
                this.updatePositions();
            }
        });

        return card;
    }

    updatePositions() {
        const n = this.slides.length;
        const dim = 1 - Math.max(0, Math.min(100, this.options.opacity)) / 100;
        const loop = true;

        this.cardElements.forEach((card, i) => {
            let rel = i - this.active;

            if (loop && n > 2) {
                if (rel > n / 2) rel -= n;
                if (rel < -n / 2) rel += n;
            }

            const ax = Math.abs(rel);
            const visible = ax <= MAX_VISIBLE;
            const isActive = rel === 0;

            const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
            const tx = rel * (this.options.gap * 30);
            const tz = -ax * DEPTH;
            const ry = -rel * this.options.tilt;
            const rz = rel * this.options.sideTilt;

            card.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`;
            card.style.opacity = visible ? '1' : '0';
            card.style.cursor = this.options.autoplay || isActive ? 'default' : 'pointer';
            card.style.pointerEvents = visible && !this.options.autoplay ? 'auto' : 'none';
            card.style.zIndex = String(100 - Math.round(ax * 10));

            const dimOverlay = card.querySelector('.coverflow-dim-overlay');
            if (dimOverlay) {
                dimOverlay.style.opacity = isActive ? '0' : String(dim * 0.35);
            }

            if (isActive) {
                card.classList.add('is-active');
            } else {
                card.classList.remove('is-active');
            }
        });

        this.updateNavVisibility();
    }

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

    clear() {
        this.slides = [];
        this.cardElements = [];
        this.stage.innerHTML = '';
        this.active = 0;
        this.updateNavVisibility();
        this.stopAutoplay();
    }

    startAutoplay() {
        if (!this.options.autoplay || this.slides.length < 2) return;
        this.stopAutoplay();
        const delay = this.options.transition?.delay ?? 2.5;
        const ms = Math.max(0.3, delay) * 1000;
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

// Global helper function
function attachCoverflow(container, options = {}) {
    return new CoverflowGallery(container, options);
}
