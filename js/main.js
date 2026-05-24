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
  gsap.to('.hero__bg img, .hero__bg video', {
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
if (menuBtn && mobileMenu) {
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
}

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
function buildWorksSlides() {
  const slides = gsap.utils.toArray('.work-slide');
  const works = document.querySelector('.works');
  const bar = document.getElementById('worksProgressBar');
  const count = document.getElementById('worksCount');
  const N = slides.length;
  if (!N || !works) return;

  works.style.height = (N * 100) + 'vh';

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

      const margin = 0.04;
      const adj = (p - margin) / Math.max(0.0001, 1 - 2 * margin);
      const pos = Math.max(0, Math.min(N - 1, adj * (N - 1)));

      slides.forEach((slide, i) => {
        const dist = i - pos;
        const aDist = Math.abs(dist);

        // クロスフェード（遷移はキビキビと）
        const opacity = Math.max(0, 1 - aDist * 1.4);
        slide.style.opacity = String(opacity);

        // フレームに方向性のあるクリップリビール（未来→右が閉じる、過去→左が閉じる）
        const frame = slide.querySelector('.work-slide__frame');
        if (frame) {
          const clamped = Math.max(-1, Math.min(1, dist));
          const leftClip  = clamped < 0 ? Math.min(100, -clamped * 100) : 0;
          const rightClip = clamped > 0 ? Math.min(100,  clamped * 100) : 0;
          frame.style.clipPath = `inset(0 ${rightClip}% 0 ${leftClip}%)`;
          // 中央近くではフレームをすこし浮かす
          const lift = (1 - Math.min(1, aDist)) * 8; // 0..8px
          frame.style.transform = `translateY(${-lift}px)`;
        }

        // 画像のサブな呼吸（中央でわずかに拡大）
        const img = slide.querySelector('img');
        if (img) {
          const breath = 1 + (1 - Math.min(1, aDist)) * 0.04; // 1.0 → 1.04
          img.style.transform = `scale(${breath})`;
        }

        // メタテキストはスライドの状態に合わせて左右にすれ違わせる
        const meta = slide.querySelector('.work-slide__meta');
        if (meta) {
          // 偶数スライドは反対方向にすれ違わせる
          const dir = (i % 2 === 0) ? 1 : -1;
          const tx = dir * dist * 40;
          const ty = dist * 24;
          meta.style.transform = `translate(${tx}px, ${ty}px)`;
          meta.style.opacity = String(Math.max(0, 1 - aDist * 1.6));
        }
      });

      // カウンタ番号
      const nearestIdx = Math.round(pos);
      if (nearestIdx !== lastIdx) {
        lastIdx = nearestIdx;
        if (count) count.textContent = String(nearestIdx + 1).padStart(2, '0');
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
  const N = chapters.length;
  if (!N) return;

  // 各章の入退場方向：左→右→上→下 と循環させて単調さを消す
  const dirs = [
    { tx:  -60, ty:    0 },  // 章1: 左から
    { tx:   60, ty:    0 },  // 章2: 右から
    { tx:    0, ty:  -60 },  // 章3: 上から
    { tx:    0, ty:   60 },  // 章4: 下から
  ];

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

      // 章テキスト：方向を循環させて入退場
      chapters.forEach((ch, i) => {
        const dist = i - pos;
        const aDist = Math.abs(dist);
        const opacity = Math.max(0, 1 - aDist * 1.9);
        const d = dirs[i % dirs.length];
        const x = d.tx * dist;
        const y = d.ty * dist;
        gsap.set(ch, { opacity, x, y });
      });

      // 背景写真：クロスフェード + 方向性クリップリビール + 一方向ズーム
      photos.forEach((photo, i) => {
        const dist = i - pos;
        const aDist = Math.abs(dist);
        const opacity = Math.max(0, 1 - aDist * 1.5);
        photo.style.opacity = String(opacity);

        // フェードに加えてクリップで方向性を出す（章ごとに違う方向で開く）
        // 章0: 横（中央→外）/ 章1: 縦 / 章2: 横（外→中央）/ 章3: 縦
        const clamped = Math.max(-1, Math.min(1, dist));
        const inset = Math.abs(clamped) * 25; // 0..25%
        let clip;
        if (i % 2 === 0) clip = `inset(0 ${inset}% 0 ${inset}%)`;
        else             clip = `inset(${inset}% 0 ${inset}% 0)`;
        photo.style.clipPath = clip;

        const img = photo.querySelector('img');
        if (img) {
          const scale = 1.10 - clamped * 0.08;
          img.style.transform = `scale(${scale})`;
        }
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
  setSrc('.about__media img', data.about);
  // hero は index.html に <video> でハードコード済み（assets/videos/hero.mp4）

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
        <div class="work-slide__frame">
          <img src="${p.src}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" />
        </div>
      </figure>
    `).join('');
    window.WORKS_DATA = data.works;
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
  // ヘッダーナビ + About 内SNS のクリックを一括処理
  document.querySelectorAll('.site-header__nav a, .about__social a').forEach(a => {
    a.addEventListener('click', () => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        track('nav_click', {
          target: href.replace('#', ''),
          location: 'header'
        });
      } else {
        const isHeader = !!a.closest('.site-header__nav');
        track('social_click', {
          platform: a.getAttribute('aria-label') || 'unknown',
          location: isHeader ? 'header' : 'about',
          url: href
        });
      }
    });
  });

  // ブランドリンク（先頭へ戻る）
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
