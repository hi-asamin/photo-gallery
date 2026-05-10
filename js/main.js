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
   実サインのベクタを clipPath の rect 幅で
   左→右にスイープして「ペンが書き進める」演出にする
---------------------------------------------------- */
function runOpening() {
  lenis.stop();
  document.body.style.overflow = 'hidden';

  const VB_WIDTH = 1700.405861;
  const rect = document.getElementById('sigRevealRect');
  const dot = document.querySelector('.sig-dot');

  const tl = gsap.timeline({
    onComplete: () => {
      lenis.start();
      document.body.style.overflow = '';
      runHeroIntro();
    }
  });

  // ペン先が左→右へ走る
  tl.to(rect, {
    attr: { width: VB_WIDTH },
    duration: 2.8,
    ease: 'power1.inOut'
  });

  // i のドットを「ぽん」と置く（ペン到達直前）
  tl.to(dot, {
    opacity: 1,
    duration: 0.22,
    ease: 'power2.out'
  }, '-=0.35');

  // 余韻
  tl.to({}, { duration: 0.55 });

  // ローダーフェードアウト → 上に抜ける
  tl.to('.loader__svg', {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.in'
  });

  tl.to('.loader', {
    yPercent: -100,
    duration: 0.95,
    ease: 'expo.inOut'
  }, '-=0.3');

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
   7. Works — Slide-by-slide pinned gallery
   1枚＝1viewportで割り当て、進度に合わせてクロスフェード。
   キャプション/カウンタは中央付近で表示、遷移中はフェード。
---------------------------------------------------- */
function updateWorksCaption(i) {
  const data = window.WORKS_DATA;
  if (!data || !data[i]) return;
  const w = data[i];
  const num = document.querySelector('.caption__num');
  const title = document.querySelector('.caption__title');
  const sub = document.querySelector('.caption__sub');
  const count = document.getElementById('worksCount');
  if (num) num.textContent = String(i + 1).padStart(2, '0');
  if (title) title.textContent = w.title || '';
  if (sub) sub.textContent = [w.location, w.year].filter(Boolean).join(', ');
  if (count) count.textContent = String(i + 1).padStart(2, '0');
}

function buildWorksSlides() {
  const slides = gsap.utils.toArray('.work-slide');
  const works = document.querySelector('.works');
  const bar = document.getElementById('worksProgressBar');
  const caption = document.getElementById('worksCaption');
  const N = slides.length;
  if (!N || !works) return;

  // セクション全体を N×100vh にしてピン領域を確保
  works.style.height = (N * 100) + 'vh';

  // 初期表示
  gsap.set(slides, { opacity: 0 });
  gsap.set(slides[0], { opacity: 1 });

  let lastIdx = 0;

  ScrollTrigger.create({
    trigger: works,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;
      if (bar) bar.style.width = (p * 100) + '%';

      // 進度を0..(N-1)のスライド位置にマップ（端を少し保持）
      const margin = 0.04;
      const adj = (p - margin) / Math.max(0.0001, 1 - 2 * margin);
      const pos = Math.max(0, Math.min(N - 1, adj * (N - 1)));

      // 各スライドのopacityとscale
      slides.forEach((slide, i) => {
        const dist = Math.abs(i - pos);
        const opacity = Math.max(0, 1 - dist * 1.4);
        gsap.set(slide, { opacity });
        const img = slide.querySelector('img');
        if (img) {
          // 中央付近で1.0、離れるほど1.06に拡大
          const scale = 1.06 - Math.max(0, 1 - dist) * 0.06;
          img.style.transform = `scale(${scale})`;
        }
      });

      // キャプションは中央付近で表示、遷移中はフェード
      if (caption) {
        const distToNearest = Math.abs(pos - Math.round(pos));
        const opacity = Math.max(0, 1 - distToNearest * 3);
        caption.style.opacity = String(opacity);
      }

      // 最寄りスライドが変わったらキャプション内容を更新
      const nearestIdx = Math.round(pos);
      if (nearestIdx !== lastIdx) {
        lastIdx = nearestIdx;
        updateWorksCaption(nearestIdx);
      }
    }
  });
}

/* ----------------------------------------------------
   8. Story — Apple LP-like chapter scrollytelling
   章ごとに見出しが切り替わり、背景画像はスティッキーで保持
---------------------------------------------------- */
function buildStoryPin() {
  const chapters = gsap.utils.toArray('.chapter');
  const media = document.querySelector('#storyMedia img');
  const bar = document.getElementById('storyProgressBar');
  const N = chapters.length;
  if (!N) return;

  ScrollTrigger.create({
    trigger: '.story',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;

      // 背景画像をゆっくり拡大（Apple同様、奥に引き込まれる感じ）
      if (media) media.style.transform = `scale(${1 + p * 0.45})`;
      if (bar) bar.style.width = (p * 100) + '%';

      // 章を進行に応じて切替（クロスフェード + Y方向のすれ違い）
      const margin = 0.06; // 最初と最後の章を少し長く保持
      const adj = (p - margin) / Math.max(0.0001, 1 - 2 * margin);
      const pos = Math.max(0, Math.min(N - 1, adj * (N - 1)));

      chapters.forEach((ch, i) => {
        const dist = i - pos;
        const opacity = Math.max(0, 1 - Math.abs(dist) * 1.9);
        const y = dist * 60;
        gsap.set(ch, { opacity, y });
      });
    }
  });
}

/* ----------------------------------------------------
   8b. Hero — scale-down exit (Apple LP風）
   スクロールで次セクションに移る瞬間に縮んでカード化
---------------------------------------------------- */
function buildHeroExit() {
  gsap.to('.hero', {
    scale: 0.94,
    borderRadius: 28,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'bottom bottom',
      end: 'bottom 30%',
      scrub: 0.4
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

  const stage = document.getElementById('worksStage');
  if (stage && Array.isArray(data.works)) {
    stage.innerHTML = data.works.map((p, i) => `
      <figure class="work-slide" data-i="${i}">
        <img src="${p.src}" alt="${p.title || ''}" loading="${i === 0 ? 'eager' : 'lazy'}" />
      </figure>
    `).join('');
    window.WORKS_DATA = data.works;
    const total = document.getElementById('worksTotal');
    if (total) total.textContent = String(data.works.length).padStart(2, '0');
    updateWorksCaption(0);
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
  buildWorksSlides();
  buildStoryPin();
  buildHeroExit();
  buildReveals();
  buildTitleReveals();
  runOpening();

  // Refresh after fonts/images settle
  setTimeout(() => ScrollTrigger.refresh(), 300);
});
