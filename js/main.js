/* ==================================================
   ASAMI — Photography
   GSAP + ScrollTrigger + Lenis
================================================== */

gsap.registerPlugin(ScrollTrigger);

/* ----------------------------------------------------
   1. Smooth Scroll (Lenis)
---------------------------------------------------- */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ----------------------------------------------------
   2. Opening Signature Animation
   1画＝1パスとして順番にstroke-dashoffsetを動かし、
   ペン先が走るように描画する（svgartistaと同方式）
---------------------------------------------------- */
function runOpening() {
  lenis.stop();
  document.body.style.overflow = 'hidden';

  const paths = Array.from(document.querySelectorAll('.sig-path'));

  // 各パスの実際の周長を測ってdasharray/offsetをセット
  paths.forEach(p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  const tl = gsap.timeline({
    onComplete: () => {
      lenis.start();
      document.body.style.overflow = '';
      runHeroIntro();
    }
  });

  // 1画ずつ順番に描く（ペン速度は文字長に応じて少し変える）
  paths.forEach((p, i) => {
    const len = p.getTotalLength();
    // ペン速度を一定に → 短い画は速く、長い画は時間をかける
    const dur = Math.max(0.35, Math.min(0.9, len / 360));
    tl.to(p, {
      strokeDashoffset: 0,
      duration: dur,
      ease: 'power1.inOut'
    }, i === 0 ? 0 : '-=0.08'); // 画と画の間にわずかな繋ぎ
  });

  // i のドットを最後に「ぽん」と置く
  tl.fromTo('.sig-dot',
    { opacity: 0, attr: { r: 0 } },
    { opacity: 1, attr: { r: 3.5 }, duration: 0.28, ease: 'back.out(2.4)' },
    '+=0.05'
  );

  // 余韻
  tl.to({}, { duration: 0.55 });

  // ローダーが上に抜ける
  tl.to('.loader__svg', {
    opacity: 0,
    duration: 0.45,
    ease: 'power2.in'
  });

  tl.to('.loader', {
    yPercent: -100,
    duration: 0.95,
    ease: 'expo.inOut'
  }, '-=0.25');

  tl.set('.loader', { display: 'none' });
}

/* ----------------------------------------------------
   3. Hero Intro (titles slide in)
---------------------------------------------------- */
function runHeroIntro() {
  const tl = gsap.timeline();

  tl.to('.hero__kicker', {
    opacity: 0.85,
    y: 0,
    duration: 0.8,
    ease: 'power3.out'
  });

  tl.to('.hero__title .line > span', {
    y: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: 'expo.out'
  }, '-=0.4');

  tl.to('.hero__subtitle', {
    opacity: 0.85,
    duration: 0.6,
    ease: 'power2.out'
  }, '-=0.3');

  tl.to('.hero__scroll', {
    opacity: 0.7,
    duration: 0.6
  }, '-=0.2');

  // 背景パララックス
  gsap.to('.hero__bg img', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}

/* ----------------------------------------------------
   4. Header — scroll state
---------------------------------------------------- */
ScrollTrigger.create({
  start: 'top -80',
  end: 99999,
  toggleClass: { className: 'is-scrolled', targets: '#siteHeader' }
});

/* ----------------------------------------------------
   5. Mobile Menu
---------------------------------------------------- */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('is-open');
  mobileMenu.classList.toggle('is-open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    menuBtn.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
  });
});

/* ----------------------------------------------------
   6. Intro text — word-by-word reveal
---------------------------------------------------- */
function buildIntroWords() {
  const el = document.getElementById('introText');
  if (!el) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  const spans = el.querySelectorAll('.word');

  ScrollTrigger.create({
    trigger: el,
    start: 'top 75%',
    end: 'bottom 40%',
    scrub: true,
    onUpdate: (self) => {
      const total = spans.length;
      const active = Math.floor(self.progress * total);
      spans.forEach((s, i) => s.classList.toggle('is-active', i <= active));
    }
  });
}

/* ----------------------------------------------------
   7. Works — Horizontal pinned scroll
---------------------------------------------------- */
function buildHorizontalScroll() {
  const track = document.getElementById('hscrollTrack');
  const wrap = document.getElementById('hscroll');
  if (!track || !wrap) return;

  const scrollAmount = () => track.scrollWidth - window.innerWidth;

  gsap.to(track, {
    x: () => -scrollAmount(),
    ease: 'none',
    scrollTrigger: {
      trigger: wrap,
      start: 'top top',
      end: () => '+=' + scrollAmount(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1
    }
  });

  // カードがスクロールに合わせて回転＆スケール
  gsap.utils.toArray('.card').forEach((card, i) => {
    gsap.fromTo(card, {
      yPercent: 8,
      scale: 0.94,
    }, {
      yPercent: 0,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: card,
        containerAnimation: ScrollTrigger.getById('hscroll-anim') || undefined,
        start: 'left right',
        end: 'right left',
        scrub: true
      }
    });
  });
}

/* ----------------------------------------------------
   8. Story — sticky line crossfade
---------------------------------------------------- */
function buildStoryPin() {
  const lines = gsap.utils.toArray('.story__line');
  const media = document.querySelector('#storyMedia img');
  if (!lines.length) return;

  ScrollTrigger.create({
    trigger: '.story',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      // 背景のスケール
      if (media) {
        const scale = 1.05 + self.progress * 0.15;
        media.style.transform = `scale(${scale})`;
      }
      // 行の切り替え
      const step = Math.min(lines.length - 1, Math.floor(self.progress * lines.length));
      lines.forEach((l, i) => {
        gsap.to(l, {
          opacity: i === step ? 1 : 0,
          y: i === step ? 0 : (i < step ? -40 : 40),
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
    }
  });
}

/* ----------------------------------------------------
   9. Reveal on scroll (grid, about)
---------------------------------------------------- */
function buildReveals() {
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
      }
    });
  });
}

/* ----------------------------------------------------
   10. Section title reveal
---------------------------------------------------- */
function buildTitleReveals() {
  // section titles fade up
  gsap.utils.toArray('.section__title').forEach(t => {
    gsap.from(t, {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: t,
        start: 'top 80%'
      }
    });
  });

  // section index labels
  gsap.utils.toArray('.section__index').forEach(t => {
    gsap.from(t, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: t,
        start: 'top 85%'
      }
    });
  });
}

/* ----------------------------------------------------
   11. Render photos from data (photos.js)
---------------------------------------------------- */
function buildPhotos() {
  const data = window.PHOTOS;
  if (!data) return;

  const setSrc = (selector, url) => {
    const img = document.querySelector(selector);
    if (img && url) img.src = url;
  };
  setSrc('.hero__bg img', data.hero);
  setSrc('#storyMedia img', data.story);
  setSrc('.about__media img', data.about);

  const track = document.getElementById('hscrollTrack');
  if (track && Array.isArray(data.works)) {
    track.innerHTML = data.works.map((p, i) => `
      <article class="card">
        <div class="card__img">
          <img src="${p.src}" alt="${p.title || ''}" loading="lazy" />
        </div>
        <div class="card__meta">
          <span>${String(i + 1).padStart(2, '0')}</span>
          <h3>${p.title || ''}</h3>
          <p>${[p.location, p.year].filter(Boolean).join(', ')}</p>
        </div>
      </article>
    `).join('');
  }

  const grid = document.getElementById('grid');
  if (grid && Array.isArray(data.archive)) {
    grid.innerHTML = data.archive.map(p => {
      const cls = p.layout && p.layout !== 'default'
        ? `grid__item grid__item--${p.layout}`
        : 'grid__item';
      return `<figure class="${cls}" data-reveal><img src="${p.src}" alt="" loading="lazy" /></figure>`;
    }).join('');
  }
}

/* ----------------------------------------------------
   Init
---------------------------------------------------- */
window.addEventListener('load', () => {
  buildPhotos();
  buildIntroWords();
  buildHorizontalScroll();
  buildStoryPin();
  buildReveals();
  buildTitleReveals();
  runOpening();

  // Refresh after fonts/images settle
  setTimeout(() => ScrollTrigger.refresh(), 300);
});
