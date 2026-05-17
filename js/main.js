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

  const VB_WIDTH = 1564.402026;
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
  const bignum = document.getElementById('worksBignum');
  const N = slides.length;
  if (!N || !works) return;

  // セクション全体を N×100vh にしてピン領域を確保
  works.style.height = (N * 100) + 'vh';

  // 初期表示
  gsap.set(slides, { opacity: 0, yPercent: 0 });
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

      const margin = 0.04;
      const adj = (p - margin) / Math.max(0.0001, 1 - 2 * margin);
      const pos = Math.max(0, Math.min(N - 1, adj * (N - 1)));

      slides.forEach((slide, i) => {
        const dist = i - pos;                  // 符号付き距離
        const aDist = Math.abs(dist);
        const opacity = Math.max(0, 1 - aDist * 1.4);

        // 縦方向のスライド：未来は下から、過去は上へ
        // クランプ範囲を絞り、隣接スライド以上は固定
        const clamped = Math.max(-1.2, Math.min(1.2, dist));
        const yPercent = clamped * 18;         // ±21.6% まで

        gsap.set(slide, { opacity, yPercent });

        // 画像にケンバーンズ：見えている間にゆっくり拡大＋微かなパン
        const img = slide.querySelector('img');
        if (img) {
          // dist=+1: scale 1.02, dist=0: scale 1.08, dist=-1: scale 1.14
          const scale = 1.08 - clamped * 0.06;
          // パン：中央付近で 0、離れるほど ±2%
          const panY = clamped * 2;
          img.style.transform = `scale(${scale}) translateY(${panY}%)`;
        }
      });

      // キャプションは中央付近で表示
      if (caption) {
        const distToNearest = Math.abs(pos - Math.round(pos));
        const cOpacity = Math.max(0, 1 - distToNearest * 3);
        caption.style.opacity = String(cOpacity);
      }

      // 巨大番号：常に「現在の番号」を表示し、切替時にポップ
      const nearestIdx = Math.round(pos);
      if (nearestIdx !== lastIdx) {
        lastIdx = nearestIdx;
        updateWorksCaption(nearestIdx);
        if (bignum) {
          bignum.textContent = String(nearestIdx + 1).padStart(2, '0');
          gsap.fromTo(bignum,
            { scale: 0.82, opacity: 0 },
            { scale: 1, opacity: 0.13, duration: 0.6, ease: 'expo.out', overwrite: true }
          );
        }
      }

      // 巨大番号は最寄り中心からの距離で透明度を抑える（遷移中はやや暗く）
      if (bignum) {
        const distToNearest = Math.abs(pos - Math.round(pos));
        const baseOp = 0.13 - distToNearest * 0.06;
        bignum.style.opacity = String(Math.max(0.04, baseOp));
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
  const photos = gsap.utils.toArray('.story-photo');
  const bar = document.getElementById('storyProgressBar');
  const bignum = document.getElementById('storyBignum');
  const N = chapters.length;
  if (!N) return;

  let lastIdx = 0;

  ScrollTrigger.create({
    trigger: '.story',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;
      if (bar) bar.style.width = (p * 100) + '%';

      const margin = 0.06;
      const adj = (p - margin) / Math.max(0.0001, 1 - 2 * margin);
      const pos = Math.max(0, Math.min(N - 1, adj * (N - 1)));

      // 章テキスト：左右交互に入退場 + Y方向のすれ違い
      chapters.forEach((ch, i) => {
        const dist = i - pos;
        const aDist = Math.abs(dist);
        const opacity = Math.max(0, 1 - aDist * 1.9);
        const y = dist * 70;
        // 偶数章は右↔︎、奇数章は左↔︎ にすれ違う
        const dir = (i % 2 === 0) ? 1 : -1;
        const x = dir * dist * 60;
        gsap.set(ch, { opacity, y, x });
      });

      // 背景写真：章ごとにクロスフェード + 個別ケンバーンズ
      photos.forEach((photo, i) => {
        const dist = i - pos;
        const aDist = Math.abs(dist);
        const opacity = Math.max(0, 1 - aDist * 1.5);
        photo.style.opacity = String(opacity);
        const img = photo.querySelector('img');
        if (img) {
          // 出現中: 1.02 → 中央: 1.10 → 退出中: 1.18（一方向ズーム）
          const clamped = Math.max(-1.2, Math.min(1.2, dist));
          const scale = 1.10 - clamped * 0.08;
          img.style.transform = `scale(${scale})`;
        }
      });

      // 巨大章番号
      const nearestIdx = Math.round(pos);
      if (nearestIdx !== lastIdx) {
        lastIdx = nearestIdx;
        if (bignum) {
          bignum.textContent = String(nearestIdx + 1).padStart(2, '0');
          gsap.fromTo(bignum,
            { scale: 0.82, opacity: 0 },
            { scale: 1, opacity: 0.08, duration: 0.7, ease: 'expo.out', overwrite: true }
          );
        }
      }
      if (bignum) {
        const distToNearest = Math.abs(pos - Math.round(pos));
        const baseOp = 0.08 - distToNearest * 0.04;
        bignum.style.opacity = String(Math.max(0.02, baseOp));
      }
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
  setSrc('.about__media img', data.about);

  // Story: 章数に合わせて複数の写真をスタック
  const storyMedia = document.getElementById('storyMedia');
  if (storyMedia) {
    const storyArr = Array.isArray(data.story) ? data.story : (data.story ? [data.story] : []);
    storyMedia.innerHTML = storyArr.map((src, i) => `
      <div class="story-photo" data-i="${i}">
        <img src="${src}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" />
      </div>
    `).join('');
  }

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
   12. GA4 — custom click events
   PV と滞在時間は gtag('config', ...) と GA4 Enhanced Measurement で自動取得。
   ここでは「どのリンクが押されたか」の構造化イベントを追加で送る。
---------------------------------------------------- */
function track(name, params) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params || {});
  }
}

function buildAnalytics() {
  // ヘッダーナビ（WORKS / STORY / ABOUT）
  document.querySelectorAll('.site-header__nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      track('nav_click', {
        target: (a.getAttribute('href') || '').replace('#', ''),
        location: 'header'
      });
    });
  });

  // モバイルメニュー
  document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
      track('nav_click', {
        target: (a.getAttribute('href') || '').replace('#', ''),
        location: 'mobile_menu'
      });
    });
  });

  // SNSアイコン（ヘッダー & About）
  document.querySelectorAll('.site-header__nav .icon-link, .about__social a').forEach(a => {
    a.addEventListener('click', () => {
      const isHeader = a.closest('.site-header__nav');
      track('social_click', {
        platform: a.getAttribute('aria-label') || 'unknown',
        location: isHeader ? 'header' : 'about',
        url: a.getAttribute('href') || ''
      });
    });
  });

  // ブランドロゴ（先頭へ戻る）
  const brand = document.querySelector('.site-header__brand');
  if (brand) {
    brand.addEventListener('click', () => {
      track('brand_click', { location: 'header' });
    });
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
  buildAnalytics();
  runOpening();

  // Refresh after fonts/images settle
  setTimeout(() => ScrollTrigger.refresh(), 300);
});
