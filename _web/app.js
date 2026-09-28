/* ═══════════════════════════════════════════════════════════════════════
   김효곤 — 발상의 아카이브 / app.js
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var D = window.ARCHIVE || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var enc = function (p) { return p.split("/").map(encodeURIComponent).join("/"); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };

  /* ── 유실 이미지 대체(placeholder) ─────────────────────────────────────
     원본 파일이 없는 경우 썸네일로, 썸네일도 없으면 안내 그래픽으로 대체한다. */
  var MISSING = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640">' +
    '<rect width="100%" height="100%" fill="#0d1428"/>' +
    '<rect x="8" y="8" width="884" height="624" fill="none" stroke="#2b3550" stroke-width="2" stroke-dasharray="10 8"/>' +
    '<text x="450" y="300" fill="#8b93a8" font-family="sans-serif" font-size="30" text-anchor="middle">이미지 원본 파일을 찾을 수 없습니다</text>' +
    '</svg>');

  /* img 요소에 폴백 체인을 건다: src → thumb → placeholder */
  function withFallback(im, item, onFallback) {
    var chain = [];
    if (item.src)   chain.push(item.src);
    if (item.thumb && item.thumb !== item.src) chain.push(item.thumb);
    var k = 0;
    im.onerror = function () {
      k++;
      if (k < chain.length) {
        if (onFallback) onFallback(k);
        im.src = enc(chain[k]);
      } else {
        im.onerror = null;
        if (onFallback) onFallback(-1);
        im.src = MISSING;
      }
    };
    return chain;
  }

  /* ── 공모전 입상 건수 추이 (첨부 차트 기준, 합계 139) ───────────────── */
  var SERIES = [
    [2004, 2], [2006, 1], [2007, 1], [2008, 7], [2009, 3], [2010, 10], [2011, 6],
    [2012, 1], [2013, 2], [2014, 1], [2015, 5], [2016, 8], [2017, 10], [2018, 9],
    [2019, 18], [2020, 16], [2021, 4], [2022, 11], [2023, 2], [2024, 12], [2025, 10]
  ];

  /* ── 장관상 12 ───────────────────────────────────────────────────────── */
  var MINISTER = [
    { y: 2007, t: "건설교통부 공모전",            p: "최우수상", m: "건설교통부장관상" },
    { y: 2010, t: "저작권위원회 공모전",          p: "대상",     m: "문화체육관광부장관상" },
    { y: 2011, t: "어린이안전 공모전",            p: "대상",     m: "행정안전부장관상" },
    { y: 2016, t: "건강생활실천 공모전",          p: "대상",     m: "보건복지부장관상" },
    { y: 2016, t: "노후준비 콘텐츠 공모전",       p: "대상",     m: "보건복지부장관상" },
    { y: 2017, t: "연구실안전 공모전",            p: "대상",     m: "과학기술정보통신부장관상" },
    { y: 2017, t: "해양수산부 해양레저 공모전",   p: "최우수상", m: "해양수산부장관상" },
    { y: 2018, t: "전기안전 콘텐츠 공모전",       p: "대상",     m: "산업통상자원부장관상" },
    { y: 2020, t: "법무부 웹툰 공모전",           p: "우수상",   m: "법무부장관상" },
    { y: 2020, t: "가족언어생활 공모전",          p: "최우수상", m: "여성가족부장관상" },
    { y: 2023, t: "제27회 보훈콘텐츠 공모전",     p: "대상",     m: "국가보훈부장관상" },
    { y: 2024, t: "제11회 기업가정신 콘텐츠 공모전", p: "대상",  m: "중소벤처기업부장관상" }
  ];
  var MIN_YEARS = {};
  MINISTER.forEach(function (m) { MIN_YEARS[m.y] = (MIN_YEARS[m.y] || 0) + 1; });
  var PEAK_YEAR = 2019;

  /* ── 카테고리 부제 ───────────────────────────────────────────────────── */
  var CAT_NOTE = {
    "전시":       "2012 언론사 주제 인포그래픽 전시 · 2018 한국카툰협회 평화카툰전 · 2020 한국만화박물관 신년 카툰전",
    "출판":       "2005 우당탕탕 글씨마스터(전5권) · 2022 2035 미래세상 · 2023 국가참조표준 새로운 히어로의 탄생",
    "만화":       "기관 사보 만화 연재 — KISTI · 문화재사랑 · 한국지하수지열협회 · 발명특허 외",
    "웹툰":       "2013 우정문화(21화) · 2017 도로교통공단(10화) · 2018 한국연구재단 · 2026 인산TOON(연재 중)",
    "인포그래픽": "2011 과학일러스트 최우수상 · 2011 한국에너지연구원 우수상 · 2012 국가핵융합연구소 금상",
    "일러스트":   "1998 펜화부터 2022 정부 성과 카드뉴스까지 — 25년의 드로잉"
  };

  /* ═══════════════════════════════ LIGHTBOX ══════════════════════════════ */
  var LB = {
    set: [], i: 0,
    node: $("#lb"), img: $("#lbImg"), cap: $("#lbCap"),
    open: function (set, i) {
      this.set = set; this.i = i;
      this.node.classList.add("on");
      this.node.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      this.show();
    },
    show: function () {
      var it = this.set[this.i];
      if (!it) return;
      var self = this;
      var base = (it.cap || "") + "  ·  " + (this.i + 1) + " / " + this.set.length;
      this.img.alt = it.cap || "";
      this.cap.textContent = base;
      this.img.classList.remove("is-fallback");
      withFallback(this.img, it, function (k) {
        if (k === -1) {
          self.cap.textContent = base + "   ·   원본 파일 없음";
        } else {
          self.img.classList.add("is-fallback");
          self.cap.textContent = base + "   ·   미리보기 화질(원본 파일 없음)";
        }
      });
      this.img.src = enc(it.src);
    },
    step: function (d) {
      if (!this.set.length) return;
      this.i = (this.i + d + this.set.length) % this.set.length;
      this.show();
    },
    close: function () {
      this.node.classList.remove("on");
      this.node.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      this.img.src = "";
    }
  };
  $("#lbX").onclick = function () { LB.close(); };
  $("#lbPrev").onclick = function (e) { e.stopPropagation(); LB.step(-1); };
  $("#lbNext").onclick = function (e) { e.stopPropagation(); LB.step(1); };
  LB.node.onclick = function (e) { if (e.target === LB.node || e.target.tagName === "FIGURE") LB.close(); };
  document.addEventListener("keydown", function (e) {
    if (!LB.node.classList.contains("on")) return;
    if (e.key === "Escape") LB.close();
    else if (e.key === "ArrowLeft") LB.step(-1);
    else if (e.key === "ArrowRight") LB.step(1);
  });
  // swipe
  (function () {
    var x0 = null;
    LB.node.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    LB.node.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 46) LB.step(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });
  })();

  /* image tile factory — clicking opens the lightbox over `set` */
  function tile(item, set, idx, cls, tag) {
    var f = el(tag || "figure", cls || "gi");
    var im = el("img");
    im.loading = "lazy"; im.decoding = "async";
    im.alt = item.cap || "";
    withFallback(im, { src: item.thumb || item.src, thumb: item.src });
    im.src = enc(item.thumb || item.src);
    f.appendChild(im);
    var c = el("figcaption", null, esc(item.cap || ""));
    f.appendChild(c);
    f.tabIndex = 0;
    f.addEventListener("click", function () { LB.open(set, idx); });
    f.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); LB.open(set, idx); }
    });
    return f;
  }

  /* ═══════════════════════════════ HERO ═════════════════════════════════ */
  (function () {
    var bg = $("#heroBg");
    if (D.heroWall) bg.style.backgroundImage = "url('" + enc(D.heroWall.src) + "')";
    // parallax
    var t = 0;
    window.addEventListener("scroll", function () {
      if (t) return;
      t = requestAnimationFrame(function () {
        t = 0;
        var y = window.scrollY;
        if (y < window.innerHeight * 1.25) bg.style.transform = "scale(1.06) translateY(" + y * 0.22 + "px)";
      });
    }, { passive: true });
    // click hero photo -> lightbox
    if (D.heroWall) {
      bg.style.cursor = "zoom-in";
      bg.addEventListener("click", function () { LB.open([D.heroWall], 0); });
    }
  })();

  /* ═════════════════════════════ 직업 / 포트폴리오 ══════════════════════ */
  (function () {
    var rail = $("#pfRail"), set = D.portfolio || [];
    $("#pfCount").textContent = set.length + "면";
    set.forEach(function (it, i) { rail.appendChild(tile(it, set, i, "rail__it")); });
  })();

  /* ═══════════════════════════════ 경력 ═════════════════════════════════ */
  (function () {
    var tabs = $("#careerTabs"), body = $("#careerBody"), meta = $("#careerMeta");
    var cats = D.career || [];
    if (!cats.length) return;

    cats.forEach(function (c, ci) {
      var b = el("button", "tab", esc(c.cat) + " <i>" + c.count + "</i>");
      b.onclick = function () {
        $$(".tab", tabs).forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        render(ci);
      };
      tabs.appendChild(b);
    });

    function render(ci) {
      var c = cats[ci];
      meta.textContent = CAT_NOTE[c.cat] || "";
      body.innerHTML = "";
      c.projects.forEach(function (p, pi) {
        var box = el("div", "proj");
        var head = el("button", "proj__h");
        head.innerHTML =
          '<span class="proj__y' + (p.year ? "" : " na") + '">' + (p.year || "—") + "</span>" +
          '<span class="proj__t">' + esc(p.title) + "</span>" +
          '<span class="proj__n">' + p.images.length + "점</span>" +
          '<span class="proj__c">+</span>';
        var pane = el("div", "proj__b");
        var built = false;
        head.onclick = function () {
          var open = box.classList.toggle("open");
          if (open && !built) {
            built = true;
            var g = el("div", "grid");
            p.images.forEach(function (it, i) { g.appendChild(tile(it, p.images, i)); });
            pane.appendChild(g);
          }
        };
        box.appendChild(head); box.appendChild(pane);
        body.appendChild(box);
        if (pi === 0) head.click();   // 첫 프로젝트는 펼쳐서 보여준다
      });
    }

    $$(".tab", tabs)[0].click();
  })();

  /* ═══════════════════════════ 수상 타임라인 차트 ═══════════════════════ */
  var Chart = (function () {
    var svg = $("#chart");
    var W = 1120, H = 430, P = { t: 54, r: 30, b: 52, l: 46 };
    var maxV = 20;
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var X = function (i) { return P.l + (iw * i) / (SERIES.length - 1); };
    var Y = function (v) { return P.t + ih - (ih * v) / maxV; };
    var NS = "http://www.w3.org/2000/svg";
    var mk = function (t, a) {
      var n = document.createElementNS(NS, t);
      for (var k in a) n.setAttribute(k, a[k]);
      return n;
    };
    var onSelect = null, nodes = [], line, area;

    function build() {
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.innerHTML = "";

      var defs = mk("defs");
      var lg = mk("linearGradient", { id: "cg", x1: 0, y1: 0, x2: 0, y2: 1 });
      lg.appendChild(mk("stop", { offset: "0%",   "stop-color": "#3d8fd6", "stop-opacity": ".38" }));
      lg.appendChild(mk("stop", { offset: "100%", "stop-color": "#3d8fd6", "stop-opacity": "0" }));
      defs.appendChild(lg); svg.appendChild(defs);

      // y gridlines + labels
      [0, 5, 10, 15, 20].forEach(function (v) {
        svg.appendChild(mk("line", { class: "c-grid", x1: P.l, y1: Y(v), x2: W - P.r, y2: Y(v) }));
        var tx = mk("text", { class: "c-tick", x: P.l - 12, y: Y(v) + 4, "text-anchor": "end" });
        tx.textContent = v; svg.appendChild(tx);
      });
      svg.appendChild(mk("line", { class: "c-axis", x1: P.l, y1: Y(0), x2: W - P.r, y2: Y(0) }));

      var pts = SERIES.map(function (d, i) { return X(i) + "," + Y(d[1]); }).join(" ");
      area = mk("polygon", { class: "c-area",
        points: P.l + "," + Y(0) + " " + pts + " " + X(SERIES.length - 1) + "," + Y(0) });
      svg.appendChild(area);

      line = mk("polyline", { class: "c-line", points: pts });
      svg.appendChild(line);

      nodes = SERIES.map(function (d, i) {
        var g = mk("g", { class: "c-node" + (MIN_YEARS[d[0]] ? " g" : "") + (d[0] === PEAK_YEAR ? " pk" : "") });
        g.setAttribute("data-year", d[0]);
        var above = d[1] >= 4;
        var v = mk("text", { class: "c-val", x: X(i), y: Y(d[1]) + (above ? -19 : 30) });
        v.textContent = d[1];
        var dot = mk("circle", { class: "c-dot", cx: X(i), cy: Y(d[1]), r: 6 });
        var xl = mk("text", { class: "c-xl", x: X(i), y: H - 20 });
        xl.textContent = String(d[0]).slice(2) + "년";
        var hit = mk("rect", { class: "c-hit", x: X(i) - 22, y: P.t - 30, width: 44, height: ih + 62 });
        g.appendChild(hit); g.appendChild(dot); g.appendChild(v); g.appendChild(xl);
        g.addEventListener("click", function () { select(d[0]); if (onSelect) onSelect(d[0]); });
        svg.appendChild(g);
        return g;
      });

      // 총계 라벨
      var tt = mk("text", { class: "c-tick", x: P.l, y: 26, "font-size": "13" });
      tt.textContent = "2004 — 2025  ·  총 139개";
      svg.appendChild(tt);
    }

    function animate() {
      var len = line.getTotalLength ? line.getTotalLength() : 3000;
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.getBoundingClientRect();                       // force reflow
      line.style.transition = "stroke-dashoffset 2.3s cubic-bezier(.3,.7,.3,1)";
      line.style.strokeDashoffset = 0;
      area.style.transition = "opacity 1.4s ease .7s";
      area.style.opacity = 1;
      nodes.forEach(function (g, i) {
        g.style.opacity = 0;
        g.style.transition = "opacity .5s ease " + (0.32 + i * 0.09) + "s";
        requestAnimationFrame(function () { g.style.opacity = 1; });
      });
    }

    function select(year) {
      nodes.forEach(function (g) {
        g.classList.toggle("sel", +g.getAttribute("data-year") === year);
      });
    }

    return {
      build: build, animate: animate, select: select,
      on: function (fn) { onSelect = fn; }
    };
  })();
  Chart.build();

  /* ═══════════════════════════ 장관상 12 rail ═══════════════════════════ */
  (function () {
    var rail = $("#minRail");
    MINISTER.forEach(function (m) {
      var c = el("div", "min");
      c.innerHTML =
        '<div class="min__seal">🏅</div>' +
        '<div class="min__y">' + m.y + "</div>" +
        '<p class="min__t">' + esc(m.t) + "</p>" +
        '<span class="min__p">' + esc(m.p) + "</span>" +
        '<p class="min__m">' + esc(m.m) + "</p>";
      c.style.cursor = "pointer";
      c.onclick = function () { Awards.goto(m.y); };
      rail.appendChild(c);
    });
  })();

  /* ═══════════════════════════ 상장 아카이브 ════════════════════════════ */
  var Awards = (function () {
    var bar = $("#yearBar"), body = $("#certBody");
    var years = D.awardsByYear || [];
    var total = years.reduce(function (a, y) { return a + y.images.length; }, 0);
    $("#certCount").textContent = total + "점";
    var cur = "all";

    function chip(label, sub, val, gold) {
      var b = el("button", "yb" + (gold ? " gold" : ""), esc(label) + "<i>" + esc(sub) + "</i>");
      b.onclick = function () { set(val); };
      b.setAttribute("data-v", val);
      return b;
    }

    function build() {
      bar.appendChild(chip("전체", total + "점", "all", false));
      years.forEach(function (y) {
        bar.appendChild(chip(String(y.year), y.images.length + "점", y.year, !!MIN_YEARS[y.year]));
      });
    }

    function set(v) {
      cur = v;
      $$(".yb", bar).forEach(function (b) {
        b.classList.toggle("on", String(b.getAttribute("data-v")) === String(v));
      });
      body.innerHTML = "";
      years.filter(function (y) { return v === "all" || y.year === v; })
        .slice().reverse()
        .forEach(function (y) {
          var sec = el("section", "certyear");
          var mins = MINISTER.filter(function (m) { return m.y === y.year; });
          sec.innerHTML =
            '<div class="certyear__h">' +
              '<span class="certyear__y">' + y.year + "</span>" +
              '<span class="certyear__n">상장 ' + y.images.length + "점</span>" +
              (mins.length ? '<span class="certyear__b">장관상 ' + mins.length + "</span>" : "") +
            "</div>";
          var g = el("div", "certgrid");
          y.images.forEach(function (it, i) { g.appendChild(tile(it, y.images, i, "cert")); });
          sec.appendChild(g);
          body.appendChild(sec);
        });
      if (v !== "all") Chart.select(v);
    }

    return {
      init: function () { build(); set("all"); },
      goto: function (year) {
        set(year);
        var t = $("#certBody").getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: t, behavior: "smooth" });
      }
    };
  })();
  Awards.init();
  Chart.on(function (y) { Awards.goto(y); });

  /* ═══════════════════════════════ AI 영상 ══════════════════════════════ */
  (function () {
    var grid = $("#vidGrid"), vids = D.videos || [];
    vids.forEach(function (v) {
      var card = el("article", "vid" + (v.vertical ? " vert" : ""));
      card.innerHTML =
        '<div class="vid__m">' +
          '<img loading="lazy" decoding="async" src="' + enc(v.poster || "") + '" alt="' + esc(v.title) + '">' +
          '<span class="vid__or">' + (v.vertical ? "세로 · 숏폼" : "가로") + "</span>" +
          '<button class="vid__play" aria-label="' + esc(v.title) + ' 재생"><i>▶</i></button>' +
        "</div>" +
        '<div class="vid__b">' +
          '<div class="vid__meta">' +
            '<span class="vid__y">' + v.year + "</span>" +
            '<span class="vid__pz pz-' + esc(v.prize) + '">' + esc(v.prize) + "</span>" +
          "</div>" +
          '<h4 class="vid__t">' + esc(v.title) + "</h4>" +
          '<p class="vid__sz">MP4 · ' + v.mb + "MB</p>" +
        "</div>";
      var media = $(".vid__m", card);
      (function (pi) { if (pi) { withFallback(pi, { src: v.poster }); } })($("img", media));
      $(".vid__play", card).onclick = function () {
        // stop any other playing video
        $$("video", grid).forEach(function (o) { o.pause(); });
        var vd = el("video");
        vd.src = enc(v.src);
        vd.poster = enc(v.poster || "");
        vd.controls = true; vd.playsInline = true; vd.preload = "metadata";
        media.innerHTML = "";
        media.appendChild(vd);
        vd.play().catch(function () { /* 사용자 조작 필요 시 컨트롤로 재생 */ });
      };
      grid.appendChild(card);
    });
  })();

  /* ═══════════════════════════ 유튜브 채널 ══════════════════════════════ */
  (function () {
    var list = $("#ytList"), player = $("#ytPlayer");
    if (!list || !player) return;
    $$("button", list).forEach(function (b) {
      b.onclick = function () {
        $$("button", list).forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        player.src = "https://www.youtube.com/embed/" + b.getAttribute("data-v") + "?rel=0&autoplay=1";
      };
    });
  })();

  /* ══════════════════════════ nav / rails / reveal ══════════════════════ */
  // rail arrows
  $$(".rbtn").forEach(function (b) {
    b.onclick = function () {
      var r = document.getElementById(b.getAttribute("data-scroll"));
      r.scrollBy({ left: (+b.getAttribute("data-dir")) * Math.max(280, r.clientWidth * 0.8), behavior: "smooth" });
    };
  });

  // burger
  var links = $(".nav__links");
  $("#burger").onclick = function () { links.classList.toggle("open"); };
  $$(".nav__links a").forEach(function (a) {
    a.onclick = function () { links.classList.remove("open"); };
  });

  // scroll: progress bar, sticky nav, active section
  var nav = $("#nav"), pbar = $("#progressBar");
  var secs = ["about", "job", "career", "awards", "ai", "youtube"].map(function (id) { return document.getElementById(id); });
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      pbar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      nav.classList.toggle("is-stuck", y > 40);
      var act = null;
      secs.forEach(function (s) { if (s && s.getBoundingClientRect().top <= 140) act = s.id; });
      $$(".nav__links a").forEach(function (a) {
        a.classList.toggle("on", a.getAttribute("data-sec") === act);
      });
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // reveal on scroll
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach(function (n) { io.observe(n); });

  // count-up numbers
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var n = e.target, to = +n.getAttribute("data-to"), t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 1500);
        n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(performance.now());
      cio.unobserve(n);
    });
  }, { threshold: 0.6 });
  $$(".count").forEach(function (n) { cio.observe(n); });

  // draw the chart once it scrolls into view
  var chio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      Chart.animate();
      chio.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  chio.observe($("#chartCard"));
})();
