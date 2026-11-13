/* 北国龙江 · 主交互脚本（SPA 路由 + 地图 + AI 对话） */
(function () {
  const app = document.getElementById("app");
  const chatDock = document.getElementById("chatDock");
  const chatWin = document.getElementById("chatWindow");

  /* ---------- 工具 ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const cityById = id => CITIES.find(c => c.id === id);

  /* ---------- 路由 ---------- */
  function navigate(route) {
    const target = "#" + route;
    if (location.hash === target) {
      // hash 相同（例如已在首页再点"返回首页"），hashchange 不触发，手动重渲染
      render();
    } else {
      location.hash = route;
    }
  }

  /* ---------- 首页 ---------- */
  /* 首页主视觉背景轮换：11 张城市风光，每 5s 切换下一张（淡入淡出）。
   * 前 5 张为第一批，后 6 张为第二批追加；顺序即播放顺序，不替换原有素材。 */
  const HOME_SLIDES = [
    "assets/home/hero-hegang.png",
    "assets/home/hero-haerbin.png",
    "assets/home/hero-jixi.png",
    "assets/home/hero-qitaihe.png",
    "assets/home/hero-shuangyashan.png",
    "assets/home/hero-heihe.png",
    "assets/home/hero-qiqihaer.png",
    "assets/home/hero-suihua.png",
    "assets/home/hero-mudanjiang.png",
    "assets/home/hero-daqing.png",
    "assets/home/hero-jiamusi.png"
  ];

  /* 首页「不止一种打开方式」：三条交错图文，整行可点击进入对应城市介绍页。
   * layout: text-left = 左文字右图片；text-right = 左图片右文字。
   * 图片沿用各城「风光印象」写实图，主题与三座城市的代表景观一致。 */
  const FEATURE_ROWS = [
    {
      id: "haerbin", no: "01", title: "冰雪王国", city: "哈尔滨",
      tone: "ice", layout: "text-left", tag: "冰城 · 冰雪季",
      img: "assets/impression/haerbin.png",
      alt: "冬夜飘雪中的圣·索菲亚教堂，红砖墙体与绿色洋葱顶被暖灯照亮",
      place: "圣·索菲亚教堂 · 冬夜",
      desc: "零下二十度的浪漫，被雕成一座城。冰雪大世界的琉璃城堡、亚布力的雪道、中央大街的面包石路，把冬天过成一场盛大的节日。",
      chips: ["冰雪大世界", "亚布力雪场", "中央大街"]
    },
    {
      id: "daxinganling", no: "02", title: "森海雪原", city: "大兴安岭",
      tone: "forest", layout: "text-right", tag: "最北 · 林海",
      img: "assets/impression/daxinganling.png",
      alt: "漠河北极村冬日黄昏，厚雪覆盖木刻楞小屋，白桦林与暖黄窗灯相映",
      place: "漠河北极村 · 雪夜木刻楞",
      desc: "中国最北的林海，红松与白桦在雪线下铺到天边。找北、等极光、听雪落，在神州北极把时间放慢。",
      chips: ["北极村", "龙江第一湾", "白桦林"]
    },
    {
      id: "heihe", no: "03", title: "火山温泉", city: "黑河",
      tone: "fire", layout: "text-right", tag: "地火 · 堰塞湖",
      img: "assets/impression/heihe.png",
      alt: "五大连池黑色熔岩石海、碧绿堰塞湖与远处缓坡火山锥",
      place: "五大连池 · 火山石海",
      desc: "黑色熔岩石海一路漫到碧绿堰塞湖，火山锥在远处静静起伏。泡一池地热温泉，看大地留存的余温。",
      chips: ["五大连池", "火山石海", "温泉疗养"]
    }
  ];

  function renderHome() {
    const cityCards = CITIES.map(c => `
      <div class="city-card ${c.id === "haerbin" ? "hot" : ""}" data-goto="city/${c.id}" role="button" tabindex="0" aria-label="查看${esc(c.name)}介绍">
        <span class="city-dot" style="background:${dotColor(c.id)}">${esc(c.short)}</span>
        <span class="city-name">${esc(c.name)}</span>
        <svg class="city-arrow" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>`).join("");

    app.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a class="logo" href="#home" data-goto="home">
            ${snowflake(30)}<span>北国龙江</span>
          </a>
          <nav class="menu">
            <a href="#home" data-goto="home" class="active">首页</a>
            <a href="#home" data-scroll="map-section">城市探索</a>
            <a href="#chat" data-goto="chat">AI 旅行助手</a>
          </nav>
          <button class="btn btn-primary" data-scroll="map-section">开始探索</button>
        </div>
      </header>

      <section class="hero hero-with-slides">
        <div class="hero-slides" id="heroSlides">
          ${HOME_SLIDES.map((src, i) => i === 0
            ? `<div class="hero-slide active" style="background-image:url('${src}')"></div>`
            : `<div class="hero-slide" data-src="${src}"></div>`).join("")}
          <div class="hero-slide-mask hero-mask-strong"></div>
        </div>
        <div class="hero-badge">黑龙江 · 13 城文旅全景</div>
        <h1>千里冰封，万里雪飘<br>北国龙江，一生必赴</h1>
        <p>从冰城哈尔滨到神州北极漠河，从火山温泉到林海雪原——一座城一段故事，一份攻略一场旅行。</p>
        <div class="hero-cta">
          <button class="btn btn-primary" data-scroll="map-section">探索城市地图</button>
          <a class="btn btn-ghost" href="#chat" data-goto="chat">问 AI 助手</a>
        </div>
      </section>

      <section class="section map-section" id="map-section">
        <h2>点击地图，走进一座城</h2>
        <p class="section-sub">全国只作背景参考，黑龙江一省细分出 13 个关键城市。点击地图上的城市区块或右侧城市卡，即可跳转到对应城市的介绍页面。</p>
        <div class="map-layout">
          <div class="map-board" id="hlj-map"></div>
          <div class="city-grid">${cityCards}</div>
        </div>
      </section>

      <section class="section features" id="features">
        <div class="features-head">
          <span class="section-kicker">三种旅程 · 三座城</span>
          <h2>黑龙江，不止一种打开方式</h2>
          <p class="section-sub">冰雪、林海、地火……同一片黑土地，藏着三种截然不同的旅行。挑一种，走进那座城。</p>
        </div>
        <div class="feature-rows">${FEATURE_ROWS.map(r => {
          const text = `
            <div class="fr-text">
              <span class="fr-ghost" aria-hidden="true">${r.no}</span>
              <span class="fr-eyebrow"><i></i>${r.no} / ${esc(r.city)}</span>
              <h3>${esc(r.title)}</h3>
              <p class="fr-desc">${esc(r.desc)}</p>
              <div class="fr-chips">${r.chips.map(c => `<span>${esc(c)}</span>`).join("")}</div>
              <span class="fr-cta"><span>走进${esc(r.city)}</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            </div>`;
          const media = `
            <div class="fr-media">
              <img src="${r.img}" alt="${esc(r.alt)}" loading="lazy" />
              <span class="fr-tint" aria-hidden="true"></span>
              <span class="fr-badge">${esc(r.tag)}</span>
              <span class="fr-place">${esc(r.place)}</span>
            </div>`;
          return `
          <article class="feature-row fr-${r.tone} fr-${r.layout}" data-goto="city/${r.id}"
                   role="button" tabindex="0" aria-label="查看${esc(r.city)}介绍：${esc(r.title)}">
            ${r.layout === "text-left" ? text + media : media + text}
          </article>`;
        }).join("")}</div>
      </section>

      <section class="ai-banner">
        <div class="ai-banner-text">
          <h2>拿不定主意？<br>问问 AI 旅行助手</h2>
          <p>告诉它你的偏好——「想看雪」「想泡温泉」「想避暑」……它会在 13 座城市中，为你精准匹配最合适的那一个。</p>
          <a class="btn btn-primary" href="#chat" data-goto="chat">立即对话</a>
        </div>
        <div class="ai-banner-demo">
          <div class="bubble user">我想去看雪，还要泡温泉～</div>
          <div class="bubble bot">
            根据你的偏好，为你推荐——伊春！这里有大片的林海雪原，还有温泉可以放松身心，冬景绝美。
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="footer-top">
          <div class="footer-brand">${snowflake(24)}<div><strong>北国龙江</strong><span>一座城一段故事，一份攻略一场旅行</span></div></div>
          <div class="footer-links">
            <div><b>探索</b><a href="#home" data-goto="home" data-scroll="map-section">城市地图</a><a href="#chat" data-goto="chat">AI 助手</a></div>
            <div><b>联系</b><a href="#feedback" data-goto="feedback">联系我们</a></div>
          </div>
        </div>
        <div class="footer-bar">2026 北国龙江 · 黑龙江文旅门户 · 仅供演示</div>
      </footer>`;
    startHeroSlides(5000);
  }

  /* ---------- 城市详情页 ---------- */
  /* 页头背景轮换：按景区图片名称的城市关键词归类（见 data/city-scenes.js）。
   * 复用与首页相同的轮换层，但统一每 3s 切换一张（淡入淡出）；
   * 素材仅有 1 张的城市显示静态实景背景，不启动定时器。 */
  const CITY_SCENES = window.CITY_SCENES || {};
  const CITY_IMPRESSIONS = window.CITY_IMPRESSIONS || {};
  const TRIP_OPTIONS = window.TRIP_OPTIONS || [];
  const TRAVEL_RECOMMENDS = window.TRAVEL_RECOMMENDS || {};
  let heroSlidesTimer = null;

  /* 「旅游推荐」：原「旅游方向」+「推荐路线」合并而来。
   * 三档切换 + 按城市真实地势绘制的矢量路线示意图（见 js/travel-map.js）。 */
  function renderTripSection(c) {
    const d = TRAVEL_RECOMMENDS[c.id];
    if (!d) return "";
    const tabs = TRIP_OPTIONS.map(o => `
      <button class="trip-tab" data-trip="${o.id}" role="tab" aria-selected="false" title="${esc(o.desc)}">
        <span class="trip-tab-dot" style="background:${o.color}"></span>${esc(o.label)}
      </button>`).join("");
    return `
      <section class="detail-sec trip-section" id="travel-route">
        <h2>旅游推荐</h2>
        <p class="detail-text trip-intro">按「${esc(d.terrainLabel)}」的地势与景区相对方位，为${esc(c.name)}规划三档路线。${esc(d.terrainNote)}</p>
        <div class="trip-tabs" role="tablist" aria-label="旅游推荐档位">${tabs}</div>
        <div class="trip-panel" id="tripPanel"></div>
        <p class="trip-note">※ 路线为矢量示意图，非导航地图；三档报价参考公开攻略与门票区间估算，不含往返大交通，以景区当日公告为准。</p>
      </section>`;
  }

  /* 填充选中档位的路线卡与示意图；tab 高亮也在这里统一维护 */
  function renderTripPanel(cityId, optId) {
    const panel = document.getElementById("tripPanel");
    const c = cityById(cityId);
    const d = TRAVEL_RECOMMENDS[cityId];
    const opt = TRIP_OPTIONS.find(o => o.id === optId) || TRIP_OPTIONS[0];
    if (!panel || !c || !d || !opt || !d.options[opt.id]) return;
    const r = d.options[opt.id];

    document.querySelectorAll(".trip-tab").forEach(b => {
      const on = b.dataset.trip === opt.id;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });

    panel.innerHTML = `
      <div class="trip-head" style="--trip-color:${opt.color}">
        <div class="trip-title"><strong>${esc(r.title)}</strong><span>${esc(r.tag)}</span></div>
        <div class="trip-meta"><span>${esc(r.days)}</span><span>${esc(r.budget)}</span></div>
      </div>
      <p class="trip-desc">${esc(r.desc)}</p>
      <div class="trip-map">
        ${window.TravelMap
          ? window.TravelMap.render({ id: c.id, name: c.name, terrain: d.terrain, terrainLabel: d.terrainLabel }, opt, r)
          : '<div class="trip-map-fallback">路线图加载中…</div>'}
      </div>
      <ol class="trip-stops">
        ${r.stops.map((s, i) => `
          <li><span class="trip-stop-num" style="background:${opt.color}">${i + 1}</span>
            <div><b>${esc(s.n)}</b><span>${esc(s.d)}</span></div></li>`).join("")}
      </ol>`;
  }

  function renderCity(id, tripId) {
    const c = cityById(id);
    if (!c) { renderHome(); return; }
    const initialTrip = TRIP_OPTIONS.some(o => o.id === tripId) ? tripId : "premium";
    const others = CITIES.filter(x => x.id !== id).slice(0, 4);
    const slides = CITY_SCENES[c.id] || [];
    const imp = CITY_IMPRESSIONS[c.id] || null;
    /* 与首页一致：首屏只内联加载第 1 张，其余存 data-src 由轮播器按需预加载 */
    const slidesHtml = slides.length ? `
        <div class="hero-slides" id="heroSlides">
          ${slides.map((src, i) => i === 0
            ? `<div class="hero-slide active" style="background-image:url('${src}')"></div>`
            : `<div class="hero-slide" data-src="${src}"></div>`).join("")}
          <div class="hero-slide-mask"></div>
        </div>` : "";
    app.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a class="logo" href="#home" data-goto="home">${snowflake(28)}<span>北国龙江</span></a>
          <a class="btn btn-outline" data-goto="home" role="button" tabindex="0">返回首页</a>
        </div>
      </header>
      <section class="city-hero ${slides.length ? "city-hero-slides" : ""}">
        ${slidesHtml}
        <div class="hero-badge">${esc(c.tag)}</div>
        <h1>${esc(c.name)}</h1>
        <div class="city-en">${esc(c.en)}</div>
        <p>${esc(c.desc)}</p>
      </section>
      <div class="detail-body">
        <section class="detail-sec">
          <h2>城市历史</h2>
          <p class="detail-text">${esc(c.history)}</p>
          ${imp ? `<figure class="detail-img">
            <img src="${imp.img}" alt="${esc(c.name)}风光印象：${esc(imp.desc)}" loading="lazy" onerror="this.style.display='none'" />
            <figcaption>
              <span class="detail-img-title">${esc(c.name)} · 风光印象</span>
              <span class="detail-img-place">${esc(imp.place)}</span>
            </figcaption>
          </figure>` : `<div class="detail-img detail-img-empty">${esc(c.name)} · 风光印象</div>`}
        </section>
        <section class="detail-sec">
          <h2>城市特色</h2>
          <div class="tag-row">${c.features.map((f, i) => `<span class="tag ${i % 3 === 2 ? "tag-warm" : "tag-cool"}">${esc(f)}</span>`).join("")}</div>
          <p class="detail-text">${esc(c.featureDesc)}</p>
        </section>
        <section class="detail-sec">
          <h2>特色美食</h2>
          <div class="food-grid">
            ${c.foods.map(f => `
              <div class="food-card">
                <div class="food-img">
                  <img src="${f.img}" alt="${esc(f.name)}" loading="lazy" onerror="this.style.display='none'" />
                  <span class="food-fallback">${esc(f.name)}</span>
                </div>
                <div class="food-body">
                  <h3>${esc(f.name)}</h3>
                  <p class="food-taste">${esc(f.taste)}</p>
                  <div class="food-meta">
                    <span class="food-price">${esc(f.price)}</span>
                    <span class="food-rating">${esc(f.rating)}</span>
                  </div>
                </div>
              </div>`).join("")}
          </div>
        </section>
        ${renderTripSection(c)}
        <section class="detail-sec">
          <h2>继续探索</h2>
          <div class="more-cities">${others.map(o => `
            <div class="city-card" data-goto="city/${o.id}" role="button" tabindex="0">
              <span class="city-dot" style="background:${dotColor(o.id)}">${esc(o.short)}</span>
              <span class="city-name">${esc(o.name)}</span>
            </div>`).join("")}</div>
        </section>
      </div>
      <footer class="footer footer-simple">2026 北国龙江 · 黑龙江文旅门户 · 仅供演示</footer>`;
    /* 默认展示「极致体验」；从 AI 对话带档位跳转时切到对应档位并定位到路线图。
     * 城市页很长，跨页跳转用瞬时定位（平滑滚动要滚过好几屏，反而慢）；
     * 二次校正用于抵消图片加载后可能出现的布局位移。 */
    renderTripPanel(c.id, initialTrip);
    if (tripId) {
      const positionRoute = () => {
        const sec = document.getElementById("travel-route");
        if (!sec) return;
        const nav = document.querySelector(".nav");
        const offset = (nav ? nav.offsetHeight : 0) + 16;
        const top = sec.getBoundingClientRect().top + window.scrollY - offset;
        // "instant" 必须显式指定：全局 html 有 scroll-behavior:smooth，
        // 用 "auto" 会继承平滑动画，跨页跳转会卡在半路。
        window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
      };
      setTimeout(positionRoute, 60);
      setTimeout(positionRoute, 420);
    }
    /* 城市页统一 3s；仅 1 张图的城市保持静态背景 */
    if (slides.length > 1) startHeroSlides(3000);
  }

  /* 按需预加载：首页与各城市页的大图不同时下载，只提前加载即将显示的一张。
   * 首屏第 1 张已内联 background-image（无 data-src），会被自动跳过。 */
  function primeSlide(el) {
    if (!el) return;
    const src = el.getAttribute("data-src");
    if (src) {
      el.style.backgroundImage = "url('" + src + "')";
      el.removeAttribute("data-src");
    }
  }

  /* 页头背景轮换：按指定间隔切换下一张（淡入淡出）。
   * 首页 5s、13 个城市页统一 3s；切页时由 render() 统一清理定时器，避免泄漏。 */
  function startHeroSlides(intervalMs) {
    if (heroSlidesTimer) clearInterval(heroSlidesTimer);
    const wrap = document.getElementById("heroSlides");
    if (!wrap) return;
    const slides = wrap.querySelectorAll(".hero-slide");
    if (slides.length < 2) return;
    const total = slides.length;
    let idx = 0;
    // 首屏只加载第 1 张；这里提前把第 2、3 张取回，保证首次切换不出现空白
    primeSlide(slides[1]);
    primeSlide(slides[2]);
    heroSlidesTimer = setInterval(() => {
      // SPA 切页后旧 DOM 已被移除，自动清理，避免泄漏
      if (!document.body.contains(wrap)) { clearInterval(heroSlidesTimer); heroSlidesTimer = null; return; }
      slides[idx].classList.remove("active");
      idx = (idx + 1) % total;
      // 显示前先确保已加载，并预取再下一张
      primeSlide(slides[idx]);
      primeSlide(slides[(idx + 1) % total]);
      slides[idx].classList.add("active");
    }, intervalMs || 3000);
  }

  function stopHeroSlides() {
    if (heroSlidesTimer) { clearInterval(heroSlidesTimer); heroSlidesTimer = null; }
  }

  /* ---------- AI 对话页 ---------- */
  function renderChatPage() {
    const templateCards = TRAVEL_TEMPLATES.map(t => `
      <button class="tpl-card" data-tpl="${t.id}">
        <span class="tpl-icon">${templateIcon(t.icon)}</span>
        <span class="tpl-label">${esc(t.label)}</span>
      </button>`).join("");

    app.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a class="logo" href="#home" data-goto="home">${snowflake(28)}<span>北国龙江</span></a>
          <a class="btn btn-outline" data-goto="home" role="button" tabindex="0">返回首页</a>
        </div>
      </header>
      <section class="chat-hero">
        <div class="chat-avatar-big">AI</div>
        <h1>龙江旅行助手</h1>
        <p>告诉我你的旅行偏好，为你匹配最合适的龙江城市</p>
        <div class="chat-panel" id="chatPanel">
          <div class="msg-row bot">
            <div class="mini-avatar">AI</div>
            <div class="bubble bot">你好！我是龙江旅行助手。不知道去哪？点下面的场景模板，跟着填空描述你的需求，我会为你精准推荐。
              <div class="tpl-grid">${templateCards}</div>
              <div class="quick-tags">
                <button class="quick" data-q="我想看雪">想看雪</button>
                <button class="quick" data-q="我想泡温泉">想泡温泉</button>
                <button class="quick" data-q="夏天避暑去哪">夏天避暑</button>
                <button class="quick" data-q="想品尝东北美食">品尝美食</button>
                <button class="quick warm" data-q="哈尔滨三日游路线怎么安排">三日游路线</button>
                <button class="quick warm" data-q="帮我规划经济实惠的旅游路线">省钱路线</button>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <input id="chatInput" type="text" placeholder="输入你的旅行偏好，或输入「帮助」查看推荐方向…" aria-label="输入旅行偏好" />
          <button class="btn btn-primary" id="chatSend">发送</button>
        </div>
      </section>
      <footer class="footer footer-simple">2026 北国龙江 · 黑龙江文旅门户 · AI 助手仅供行程参考</footer>`;
    bindChat(document.getElementById("chatPanel"), document.getElementById("chatInput"), document.getElementById("chatSend"));
  }

  /* ---------- 意见反馈页（隐藏页） ----------
   * 不在首页导航 / 内容区放任何入口，只能由页脚「联系我们」进入 #feedback。
   * 静态演示站点没有后端，意见保存在浏览器 localStorage，不做任何上传。
   * 下方的意见汇总页（#feedback-admin）与反馈页共用同一份数据层。 */
  const FB_STORE_KEY = "hlj_feedback_v1";
  const FB_MAX = 500;
  const FB_TYPES = ["页面体验", "内容纠错", "路线建议", "功能建议", "其他"];

  /* 以「时间 + 类型 + 内容」作为稳定指纹：旧数据没有 id，也能跨浏览器导入去重 */
  function fbKey(item) {
    return [item.at || "", item.type || "", String(item.content || "").trim()].join("|");
  }
  function fbHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  /* 导入文件可能是旧格式或字段名略有差异，统一成标准结构并过滤脏数据 */
  function fbNormalize(raw) {
    if (!raw || typeof raw !== "object") return null;
    const content = String(raw.content ?? raw.text ?? "").trim();
    if (!content) return null;
    const t = String(raw.type || "其他");
    const item = {
      id: String(raw.id || ""),
      type: FB_TYPES.includes(t) ? t : "其他",
      rating: Math.min(5, Math.max(0, Number(raw.rating) || 0)),
      name: String(raw.name || "").trim(),
      email: String(raw.email || "").trim(),
      content: content.slice(0, 500),
      at: String(raw.at || "时间未知")
    };
    item.id = item.id || fbHash(fbKey(item));
    return item;
  }
  function fbRead() {
    try {
      const arr = JSON.parse(localStorage.getItem(FB_STORE_KEY) || "[]");
      return (Array.isArray(arr) ? arr : []).map(fbNormalize).filter(Boolean);
    } catch (err) { return []; }
  }
  function fbWrite(list) {
    try {
      localStorage.setItem(FB_STORE_KEY, JSON.stringify(list.slice(0, FB_MAX)));
      return true;
    } catch (err) {
      /* 隐私模式下 localStorage 可能不可用，仍给出成功反馈 */
      console.warn("意见本地保存失败", err);
      return false;
    }
  }
  function fbTime(item) {
    const t = new Date(String(item.at).replace(/\//g, "-")).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  function renderFeedbackPage() {
    const typeChips = FB_TYPES.map((t, i) => `
      <label class="fb-chip"><input type="radio" name="fbType" value="${esc(t)}" ${i === 0 ? "checked" : ""} /><span>${esc(t)}</span></label>`).join("");
    const stars = [1, 2, 3, 4, 5].map(n => `
      <button type="button" class="fb-star" data-star="${n}" aria-label="${n} 星" aria-pressed="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.47l-5.9 3.1 1.13-6.57L2.45 9.34l6.6-.96z"/></svg>
      </button>`).join("");

    app.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a class="logo" href="#home" data-goto="home">${snowflake(28)}<span>北国龙江</span></a>
          <a class="btn btn-outline" data-goto="home" role="button" tabindex="0">返回首页</a>
        </div>
      </header>

      <section class="fb-hero">
        <div class="fb-hero-inner">
          <span class="fb-kicker">CONTACT · FEEDBACK</span>
          <h1>说说你的想法</h1>
          <p>哪座城市还想看得更细？哪条路线不够顺？页面哪里用着别扭？<br>留下你的一句，我们都会认真读。</p>
        </div>
      </section>

      <section class="fb-main">
        <aside class="fb-side">
          <div class="fb-side-card">
            <h3>你的意见，会让龙江更好</h3>
            <p>这是一个文旅演示站点。无论是内容纠错、体验建议，还是想新增的城市与玩法，都可以告诉我们。</p>
            <ul class="fb-side-list">
              <li><span>01</span>告诉我们还缺什么</li>
              <li><span>02</span>指出不准确的介绍</li>
              <li><span>03</span>分享你的私藏路线</li>
            </ul>
          </div>
          <div class="fb-side-note">
            <strong>隐私说明</strong>
            <p>演示站点没有服务端，提交的内容只保存在你当前浏览器的本地存储中，不会上传；清除浏览器数据即会消失。</p>
            <a class="fb-admin-link" href="#feedback-admin" data-goto="feedback-admin">查看本机意见汇总 →</a>
          </div>
        </aside>

        <div class="fb-card">
          <form id="fbForm" novalidate>
            <div class="fb-card-head">
              <h2>提一条意见</h2>
              <span>约 1 分钟 · 仅 4 项</span>
            </div>

            <div class="fb-field">
              <label class="fb-label">1. 这条意见关于 <em>*</em></label>
              <div class="fb-chips">${typeChips}</div>
            </div>

            <div class="fb-field">
              <label class="fb-label">2. 这次逛下来，体验如何 <span class="fb-optional">选填</span></label>
              <div class="fb-stars" id="fbStars">${stars}<span class="fb-star-hint" id="fbStarHint">点一下打个分</span></div>
            </div>

            <div class="fb-field">
              <label class="fb-label">3. 怎么称呼你 <span class="fb-optional">选填</span></label>
              <div class="fb-pair">
                <input type="text" name="fbName" maxlength="30" placeholder="昵称即可" aria-label="昵称" />
                <input type="email" name="fbEmail" maxlength="80" placeholder="邮箱（如需回复）" aria-label="邮箱" />
              </div>
            </div>

            <div class="fb-field">
              <label class="fb-label" for="fbContent">4. 具体想说 <em>*</em></label>
              <textarea id="fbContent" name="fbContent" maxlength="500" rows="5"
                        placeholder="例如：希望加上伊春的冬季交通说明，或者某张图片和城市对不上……" aria-label="意见内容"></textarea>
              <div class="fb-count"><span id="fbCount">0</span> / 500</div>
            </div>

            <p class="fb-error" id="fbError" role="alert" aria-live="polite"></p>

            <div class="fb-actions">
              <button type="submit" class="btn btn-primary fb-submit">提交意见 <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <span>带 <em>*</em> 为必填</span>
            </div>
          </form>

          <div class="fb-success" id="fbSuccess" hidden>
            <div class="fb-success-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <h2>收到啦，谢谢你</h2>
            <p id="fbSuccessText"></p>
            <div class="fb-success-actions">
              <button type="button" class="btn btn-primary" id="fbAgain">再提一条</button>
              <a class="btn btn-outline" href="#home" data-goto="home">返回首页</a>
            </div>
          </div>
        </div>
      </section>

      <footer class="footer footer-simple">2026 北国龙江 · 黑龙江文旅门户 · 意见反馈仅供演示</footer>`;

    bindFeedbackForm();
  }

  /* 反馈表单交互：评分、字数、校验、本地保存、成功态 */
  function bindFeedbackForm() {
    const form = document.getElementById("fbForm");
    const box = document.getElementById("fbContent");
    const count = document.getElementById("fbCount");
    const error = document.getElementById("fbError");
    const success = document.getElementById("fbSuccess");
    const starsBox = document.getElementById("fbStars");
    const starHint = document.getElementById("fbStarHint");
    let rating = 0;

    box.addEventListener("input", () => {
      count.textContent = box.value.length;
      error.textContent = "";
    });

    starsBox.addEventListener("click", e => {
      const btn = e.target.closest(".fb-star");
      if (!btn) return;
      rating = Number(btn.dataset.star);
      starsBox.querySelectorAll(".fb-star").forEach(b => {
        const on = Number(b.dataset.star) <= rating;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      starHint.textContent = ["", "不太满意", "一般", "还不错", "挺喜欢", "非常喜欢"][rating];
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = new FormData(form);
      const content = String(data.get("fbContent") || "").trim();
      const email = String(data.get("fbEmail") || "").trim();
      if (content.length < 5) {
        error.textContent = "再多写几个字吧，至少 5 个字，我们才看得明白～";
        box.focus();
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error.textContent = "邮箱格式好像不太对，检查一下或直接留空～";
        return;
      }

      const item = fbNormalize({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        type: String(data.get("fbType") || "其他"),
        rating,
        name: String(data.get("fbName") || "").trim(),
        email,
        content,
        at: new Date().toLocaleString("zh-CN", { hour12: false })
      });
      const saved = fbWrite([item, ...fbRead()]);

      document.getElementById("fbSuccessText").textContent =
        `「${item.type}」已记下（${item.at}）${rating ? `，评分 ${rating} 星` : ""}。${saved ? "内容保存在本机浏览器。" : ""}`;
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: "instant", block: "center" });
    });

    document.getElementById("fbAgain").addEventListener("click", () => {
      form.reset();
      rating = 0;
      count.textContent = "0";
      error.textContent = "";
      starsBox.querySelectorAll(".fb-star").forEach(b => { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
      starHint.textContent = "点一下打个分";
      success.hidden = true;
      form.hidden = false;
      box.focus();
    });
  }

  /* ---------- 意见汇总页（隐藏页） ----------
   * 主页与导航都不放入口：只能从反馈页的「查看本机意见汇总」或直达 #feedback-admin 进入。
   * 站点无服务端，这里只呈现当前浏览器已提交 / 已导入的意见；导出 + 导入用于人工合并多台设备。 */
  function renderAdminPage() {
    const typeOptions = FB_TYPES.map(t => '<option value="' + t + '">' + t + '</option>').join("");
    app.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a class="logo" href="#home" data-goto="home">${snowflake(28)}<span>北国龙江</span></a>
          <div class="adm-nav-actions">
            <a class="btn btn-outline" href="#feedback" data-goto="feedback" role="button" tabindex="0">去提意见</a>
            <a class="btn btn-outline" href="#home" data-goto="home" role="button" tabindex="0">返回首页</a>
          </div>
        </div>
      </header>

      <section class="adm-hero">
        <div class="adm-hero-inner">
          <span class="fb-kicker">FEEDBACK · CONSOLE</span>
          <h1>意见汇总</h1>
          <p>看看大家留下了什么：检索、筛选、导出，也能把其他设备导出的意见合并到这里。</p>
        </div>
      </section>

      <section class="adm-wrap">
        <div class="adm-notice">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 11v5M12 7.6v.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
          <div>
            <strong>这里显示的是本机数据，不是全网数据</strong>
            <span>站点没有服务端，意见只保存在提交者自己的浏览器里。要汇总多台设备，请在各自设备导出 JSON，再回到此页导入合并；清除浏览器数据会丢失这些记录。</span>
          </div>
        </div>

        <div class="adm-stats" id="admStats"></div>

        <div class="adm-board">
          <div class="adm-toolbar">
            <div class="adm-filters">
              <input type="search" id="admSearch" placeholder="搜索内容 / 昵称 / 邮箱" aria-label="搜索意见" />
              <select id="admType" aria-label="按类型筛选"><option value="">全部类型</option>${typeOptions}</select>
              <select id="admSort" aria-label="排序方式"><option value="new">最新在前</option><option value="rating">评分优先</option></select>
            </div>
            <div class="adm-actions">
              <button type="button" class="btn btn-primary" id="admExportCsv">导出 CSV</button>
              <button type="button" class="btn btn-outline" id="admExportJson">导出 JSON</button>
              <label class="btn btn-outline adm-import">导入 JSON<input type="file" id="admImportFile" accept=".json,application/json" aria-label="选择要导入的 JSON 文件" /></label>
              <button type="button" class="btn btn-outline adm-clear" id="admClear">清空</button>
            </div>
          </div>
          <p class="adm-msg" id="admMsg" role="status" aria-live="polite"></p>
          <div class="adm-list" id="admList"></div>
        </div>
      </section>

      <footer class="footer footer-simple">2026 北国龙江 · 黑龙江文旅门户 · 意见汇总仅供演示</footer>`;
    bindAdmin();
  }

  function bindAdmin() {
    const search = document.getElementById("admSearch");
    const typeSel = document.getElementById("admType");
    const sortSel = document.getElementById("admSort");
    const stats = document.getElementById("admStats");
    const list = document.getElementById("admList");
    const msg = document.getElementById("admMsg");
    const fileInput = document.getElementById("admImportFile");

    function say(text, tone) {
      msg.textContent = text || "";
      msg.className = "adm-msg" + (text && tone ? " " + tone : "");
    }

    function filtered() {
      let arr = fbRead();
      const kw = search.value.trim().toLowerCase();
      if (kw) arr = arr.filter(x => [x.content, x.name, x.email, x.type].some(v => String(v).toLowerCase().includes(kw)));
      if (typeSel.value) arr = arr.filter(x => x.type === typeSel.value);
      arr.sort(sortSel.value === "rating"
        ? (a, b) => b.rating - a.rating || fbTime(b) - fbTime(a)
        : (a, b) => fbTime(b) - fbTime(a));
      return arr;
    }

    function paint() {
      const all = fbRead();
      const rated = all.filter(x => x.rating > 0);
      const avg = rated.length ? (rated.reduce((s, x) => s + x.rating, 0) / rated.length).toFixed(1) : "—";
      const bars = FB_TYPES.map(t => ({ t, n: all.filter(x => x.type === t).length }))
        .filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
      const maxN = bars.length ? bars[0].n : 1;
      const latest = all.slice().sort((a, b) => fbTime(b) - fbTime(a))[0];
      stats.innerHTML = `
        <div class="adm-stat"><span>意见总数</span><strong>${all.length}</strong><small>本机已收集</small></div>
        <div class="adm-stat"><span>平均评分</span><strong>${avg}${rated.length ? "<i> / 5</i>" : ""}</strong><small>${rated.length} 条打分</small></div>
        <div class="adm-stat"><span>最近提交</span><strong class="adm-stat-sm">${latest ? esc(latest.at) : "暂无"}</strong><small>${latest ? esc(latest.type) : "等待第一条意见"}</small></div>
        <div class="adm-stat adm-stat-types"><span>类型分布</span>
          <div class="adm-bars">${bars.length ? bars.map(b => `
            <div class="adm-bar"><em>${esc(b.t)}</em><div class="adm-bar-track"><i style="width:${Math.max(8, Math.round(b.n / maxN * 100))}%"></i></div><b>${b.n}</b></div>`).join("") : '<p class="adm-bars-empty">暂无数据</p>'}</div>
        </div>`;

      const arr = filtered();
      if (!arr.length) {
        list.innerHTML = `<div class="adm-empty">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v12H9l-5 4V5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          <h3>${all.length ? "没有匹配的意见" : "还没有收到意见"}</h3>
          <p>${all.length ? "换个关键词或清空筛选试试。" : "先在「联系我们」里提一条，或把其他设备导出的 JSON 导入进来。"}</p>
        </div>`;
        return;
      }
      list.innerHTML = arr.map(x => `
        <article class="adm-item">
          <div class="adm-item-top">
            <span class="adm-type">${esc(x.type)}</span>
            <span class="adm-rating">${x.rating ? "★".repeat(x.rating) + "<i>" + "★".repeat(5 - x.rating) + "</i>" : '<i class="adm-unrated">未评分</i>'}</span>
            <time>${esc(x.at)}</time>
            <button type="button" class="adm-del" data-del="${esc(x.id)}" aria-label="删除这条意见">删除</button>
          </div>
          <p class="adm-content">${esc(x.content)}</p>
          <div class="adm-meta">${x.name ? "来自 <b>" + esc(x.name) + "</b>" : "匿名"}${x.email ? " · " + esc(x.email) : ""}</div>
        </article>`).join("");
    }

    /* 危险操作统一两段式确认：第一次点击变成「确认…？」，4 秒内再点才真正执行 */
    function confirmTwice(btn, label, run) {
      if (btn.dataset.armed === "1") { run(); return; }
      document.querySelectorAll("[data-armed='1']").forEach(b => {
        b.dataset.armed = ""; b.textContent = b.dataset.plain; b.classList.remove("arming");
      });
      btn.dataset.armed = "1";
      btn.dataset.plain = btn.textContent;
      btn.textContent = label;
      btn.classList.add("arming");
      setTimeout(() => {
        if (btn.isConnected && btn.dataset.armed === "1") {
          btn.dataset.armed = ""; btn.textContent = btn.dataset.plain; btn.classList.remove("arming");
        }
      }, 4000);
    }

    function download(name, text, mime) {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
    const stamp = () => new Date().toISOString().slice(0, 10);
    const csvCell = v => '"' + String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ") + '"';

    search.addEventListener("input", paint);
    typeSel.addEventListener("change", paint);
    sortSel.addEventListener("change", paint);

    list.addEventListener("click", e => {
      const btn = e.target.closest("[data-del]");
      if (!btn) return;
      confirmTwice(btn, "确认删除？", () => {
        const id = btn.dataset.del;
        fbWrite(fbRead().filter(x => x.id !== id));
        say("已删除 1 条意见。", "ok");
        paint();
      });
    });

    document.getElementById("admClear").addEventListener("click", e => {
      confirmTwice(e.currentTarget, "确认清空全部？", () => {
        fbWrite([]);
        say("已清空本机全部意见。", "ok");
        paint();
      });
    });

    document.getElementById("admExportJson").addEventListener("click", () => {
      const all = fbRead();
      if (!all.length) { say("还没有意见可导出。", "warn"); return; }
      download("龙江意见-" + stamp() + ".json",
        JSON.stringify({ source: "北国龙江 · 意见反馈", exportedAt: new Date().toISOString(), count: all.length, items: all }, null, 2),
        "application/json;charset=utf-8");
      say("已导出 " + all.length + " 条意见（JSON）。", "ok");
    });

    document.getElementById("admExportCsv").addEventListener("click", () => {
      const all = fbRead();
      if (!all.length) { say("还没有意见可导出。", "warn"); return; }
      const head = ["提交时间", "类型", "评分", "昵称", "邮箱", "意见内容"];
      const rows = all.map(x => [x.at, x.type, x.rating || "", x.name, x.email, x.content].map(csvCell).join(","));
      download("龙江意见-" + stamp() + ".csv",
        "\ufeff" + [head.map(csvCell).join(",")].concat(rows).join("\r\n"),
        "text/csv;charset=utf-8");
      say("已导出 " + all.length + " 条意见（CSV，可直接用 Excel 打开）。", "ok");
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let parsed;
        try { parsed = JSON.parse(String(reader.result)); }
        catch (err) { say("导入失败：文件不是有效的 JSON。", "warn"); fileInput.value = ""; return; }
        const incoming = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
        if (!incoming.length) { say("导入失败：文件里没有意见条目。", "warn"); fileInput.value = ""; return; }
        const cur = fbRead();
        const seen = new Set(cur.map(fbKey));
        const merged = cur.slice();
        let added = 0, dup = 0, bad = 0;
        for (const raw of incoming) {
          const item = fbNormalize(raw);
          if (!item) { bad++; continue; }
          const k = fbKey(item);
          if (seen.has(k)) { dup++; continue; }
          seen.add(k); merged.push(item); added++;
        }
        /* 按时间倒序后再写，避免超过上限时把刚导入的新意见截掉 */
        merged.sort((a, b) => fbTime(b) - fbTime(a));
        fbWrite(merged);
        say("导入完成：新增 " + added + " 条，跳过重复 " + dup + " 条" + (bad ? "，忽略无效 " + bad + " 条" : "") + "。", added ? "ok" : "warn");
        fileInput.value = "";
        paint();
      };
      reader.onerror = () => { say("导入失败：文件读取出错。", "warn"); fileInput.value = ""; };
      reader.readAsText(file, "utf-8");
    });

    paint();
  }

  /* ---------- 对话逻辑（页面内 + 全局悬浮窗共用） ---------- */
  function bindChat(panel, input, sendBtn) {
    /* 渲染推荐结果 */
    function renderResults(results) {
      return `
        <div class="bubble bot">根据你的偏好，为你推荐${results.length > 1 ? " Top" + results.length : ""}——
          ${results.map(r => `
            <div class="rec-card" data-goto="city/${r.city.id}" role="button" tabindex="0">
              <span class="city-dot" style="background:${dotColor(r.city.id)}">${esc(r.city.short)}</span>
              <div class="rec-info"><strong>${esc(r.city.name)}</strong><span>${esc(r.matched.join(" · ") || r.city.tag)}</span></div>
              <span class="rec-go">查看详情</span>
            </div>`).join("")}
        </div>`;
    }

    /* 渲染特色问答结果 */
    function renderFeatureAnswers(answers) {
      return `
        <div class="bubble bot">
          ${answers.map(a => `
            <div class="feature-answer">
              <div class="fa-head"><span class="city-dot" style="background:${dotColor(a.city.id)}">${esc(a.city.short)}</span><strong>${esc(a.feature)}</strong></div>
              <p>${esc(a.text)}</p>
            </div>`).join("")}
        </div>`;
    }

    /* 渲染旅游路线问答结果：卡片直达对应城市 + 档位的路线示意图 */
    function renderRouteAnswers(routes, multi, flags) {
      const { noCity, byLandmark } = flags || {};
      const cityName = esc(routes[0].city.name);
      const tail = "点「查看路线图」可跳到路线示意图：";
      let lead;
      if (noCity) {
        lead = "还没说想去哪座城市，先给你几条热门方向的路线图；点进去还能在同一页面切换另外两档，想看指定城市直接告诉我「城市 + 玩法」就行：";
      } else if (byLandmark) {
        lead = `根据你提到的地标，定位到 ${cityName}，${multi ? "三档路线都列出来了，" : ""}${tail}`;
      } else {
        lead = multi ? `为你列出 ${cityName} 的三档路线，${tail}` : `为你找到 ${cityName} 的这条路线，${tail}`;
      }
      return `
        <div class="bubble bot">
          ${lead}
          ${routes.map(r => `
            <div class="route-answer">
              <div class="ra-head">
                <span class="city-dot" style="background:${dotColor(r.city.id)}">${esc(r.city.short)}</span>
                <div>
                  <strong>${esc(r.city.name)} · ${esc(r.opt.label)}</strong>
                  <span>${esc(r.option.title)} · ${esc(r.option.days)} · ${esc(r.option.budget)}</span>
                </div>
              </div>
              <p class="ra-stops">${r.option.stops.map(s => esc(s.n)).join(" → ")}</p>
              <a class="route-jump" data-goto="city/${r.city.id}/${r.optionId}" role="button" tabindex="0">查看路线图 →</a>
            </div>`).join("")}
        </div>`;
    }

    async function send(text) {
      if (!text.trim()) return;

      /* 检测是否为「AI」召唤词（仅输入 ai / AI，不含其它内容）或「帮助」 */
      const bare = text.trim().toLowerCase();
      const isSummonAI = (bare === "ai" || bare === "ai助手" || bare === "ai 助手" || bare === "aiai");
      /* 「帮助」：只要输入中包含「帮助/help」即触发场景面板（容忍标点、空格、组合词） */
      const isHelp = /帮助|help|怎么用|能干嘛|能做什么|有什么功能/.test(text);

      panel.insertAdjacentHTML("beforeend",
        `<div class="msg-row user"><div class="bubble user">${esc(text)}</div></div>`);
      panel.insertAdjacentHTML("beforeend",
        `<div class="msg-row bot" id="thinking"><div class="mini-avatar">AI</div><div class="bubble bot">正在为你匹配最合适的城市<span class="dots"><i></i><i></i><i></i></span></div></div>`);
      panel.scrollTop = panel.scrollHeight;
      input.value = "";

      /* 输入「AI」或「帮助」：弹出场景模板引导 */
      if (isSummonAI || isHelp) {
        panel.querySelector("#thinking")?.remove();
        const summonTpl = TRAVEL_TEMPLATES.map(t => `
          <button class="tpl-card" data-tpl="${t.id}">
            <span class="tpl-icon">${templateIcon(t.icon)}</span>
            <span class="tpl-label">${esc(t.label)}</span>
          </button>`).join("");
        const greet = isHelp
          ? "为你整理了几个推荐方向，选一个你感兴趣的场景，我会一步步帮你细化需求："
          : "我在的～不知道从哪开始？先选一个你感兴趣的场景，我会一步步帮你细化需求：";
        panel.insertAdjacentHTML("beforeend", `
          <div class="msg-row bot">
            <div class="mini-avatar">AI</div>
            <div class="bubble bot">${greet}
              <div class="tpl-grid">${summonTpl}</div>
            </div>
          </div>`);
        panel.scrollTop = panel.scrollHeight;
        return;
      }

      const { source, results, featureAnswers, routeAnswers, routeMulti, routeNoCity, routeByLandmark } = await Recommender.recommend(text);
      panel.querySelector("#thinking")?.remove();

      if (routeAnswers && routeAnswers.length) {
        panel.insertAdjacentHTML("beforeend",
          `<div class="msg-row bot"><div class="mini-avatar">AI</div>${renderRouteAnswers(routeAnswers, routeMulti, { noCity: routeNoCity, byLandmark: routeByLandmark })}</div>`);
      } else if (featureAnswers && featureAnswers.length) {
        panel.insertAdjacentHTML("beforeend",
          `<div class="msg-row bot"><div class="mini-avatar">AI</div>${renderFeatureAnswers(featureAnswers)}</div>`);
      } else if (!results.length) {
        /* 无匹配：随机触发一句引导语，把话题引回旅游方向 */
        panel.insertAdjacentHTML("beforeend",
          `<div class="msg-row bot"><div class="mini-avatar">AI</div><div class="bubble bot">${randomRedirect()}</div></div>`);
      } else {
        panel.insertAdjacentHTML("beforeend",
          `<div class="msg-row bot"><div class="mini-avatar">AI</div>${renderResults(results)}</div>`);
      }
      panel.scrollTop = panel.scrollHeight;
    }

    /* 无匹配时的随机引导语（多种话术随机触发，把话题引回旅游方向） */
    function randomRedirect() {
      const tips = [
        "您好，请问您有什么和旅游有关的需求吗？您可以输入「帮助」来查看推荐的方向～",
        "我主要擅长旅游相关的推荐哦～想看雪、泡温泉、避暑、找北、吃美食……都可以告诉我，或者输入「帮助」看看方向。",
        "这个问题我可能帮不上忙，不过关于黑龙江 13 城的吃喝玩乐，我可以为您精准推荐！输入「帮助」查看推荐方向吧。",
        "咱们聊聊旅行吧！您可以描述想去的地方、想做的事，也可以输入「帮助」看看我擅长哪些方向。",
        "抱歉，我还没理解您的意思～您是想找某个城市、某个景点，还是规划行程？输入「帮助」可以查看推荐方向。",
        "我专注黑龙江文旅推荐，试试告诉我「想看雪」「想泡温泉」这类需求，或输入「帮助」看看更多方向。"
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }

    sendBtn.addEventListener("click", () => send(input.value));
    input.addEventListener("keydown", e => { if (e.key === "Enter") send(input.value); });

    panel.addEventListener("click", e => {
      // 快速标签：直接发送
      const q = e.target.closest(".quick");
      if (q) { send(q.dataset.q); return; }
      // 场景模板：进入填空流程
      const tpl = e.target.closest(".tpl-card");
      if (tpl && tpl.dataset.tpl) { startTemplate(tpl.dataset.tpl); return; }
      // 填空选项：选中后推进流程
      const opt = e.target.closest(".tpl-opt");
      if (opt) { pickOption(opt); }
    });

    /* 填空式模板：逐维度让用户选择描述词 */
    let tplState = null;

    function startTemplate(id) {
      const tpl = TRAVEL_TEMPLATES.find(t => t.id === id);
      if (!tpl) return;
      tplState = { tpl, idx: 0, picks: {} };
      renderDimStep();
    }

    function renderDimStep() {
      const { tpl, idx } = tplState;
      const dim = tpl.dims[idx];
      const opts = dim.opts.map(o =>
        `<button class="tpl-opt" data-val="${esc(o)}">${esc(o)}</button>`).join("");
      const done = Object.keys(tplState.picks).length;
      panel.insertAdjacentHTML("beforeend", `
        <div class="msg-row bot" id="tpl-step">
          <div class="mini-avatar">AI</div>
          <div class="bubble bot">
            <div class="tpl-q">${idx === 0 ? `你选了「${esc(tpl.label)}」场景，我来帮你细化需求（${done}/${tpl.dims.length}）：` : "继续："}<br><b>${esc(dim.k)}</b>方面，你更倾向？</div>
            <div class="tpl-opt-grid">${opts}</div>
          </div>
        </div>`);
      panel.scrollTop = panel.scrollHeight;
    }

    function pickOption(el) {
      if (!tplState) return;
      const { tpl, idx, picks } = tplState;
      const dim = tpl.dims[idx];
      const val = el.dataset.val;
      // 记录选择
      picks[dim.k] = val;
      // 高亮已选
      el.closest(".tpl-opt-grid").querySelectorAll(".tpl-opt").forEach(b => b.classList.remove("selected"));
      el.classList.add("selected");
      document.getElementById("tpl-step")?.remove();

      if (idx + 1 < tpl.dims.length) {
        tplState.idx = idx + 1;
        renderDimStep();
      } else {
        // 全部填完，拼成完整描述并发送
        const finalText = tpl.template(picks);
        tplState = null;
        send(finalText);
      }
    }
  }

  /* ---------- 悬浮对话球 ---------- */
  function setupDock() {
    chatDock.addEventListener("click", () => {
      const open = chatWin.classList.toggle("open");
      chatDock.classList.toggle("open", open);
      if (open && !chatWin.dataset.init) {
        const dockTpl = TRAVEL_TEMPLATES.slice(0, 4).map(t =>
          `<button class="tpl-card" data-tpl="${t.id}"><span class="tpl-icon">${templateIcon(t.icon)}</span><span class="tpl-label">${esc(t.label)}</span></button>`
        ).join("");
        chatWin.querySelector(".chat-win-body").innerHTML = `
          <div class="msg-row bot">
            <div class="mini-avatar">AI</div>
            <div class="bubble bot">你好！不知道去哪？点下面的场景试试，或直接告诉我你的偏好～
              <div class="tpl-grid">${dockTpl}</div>
            </div>
          </div>`;
        bindChat(chatWin.querySelector(".chat-win-body"), chatWin.querySelector("input"), chatWin.querySelector("#dockSend"));
        chatWin.dataset.init = "1";
      }
    });
    chatWin.querySelector(".chat-win-close").addEventListener("click", () => {
      chatWin.classList.remove("open"); chatDock.classList.remove("open");
    });
  }

  /* ---------- 事件委托：跳转 + 滚动（全局一次性绑定，SPA 切换后依然生效） ---------- */
  function bindGo() {
    document.addEventListener("click", e => {
      /* 旅游推荐：三档 Tab 切换（不影响 hash，避免刷新后档位被锁死） */
      const tab = e.target.closest(".trip-tab");
      if (tab) {
        const parts = location.hash.replace("#", "").split("/");
        if (parts[0] === "city" && parts[1]) renderTripPanel(parts[1], tab.dataset.trip);
        return;
      }
      const el = e.target.closest("[data-goto],[data-scroll]");
      if (!el) return;
      e.preventDefault();
      /* 从悬浮对话窗跳转时先收起窗口，避免遮挡目标页 */
      if (el.closest("#chatWindow")) {
        chatWin.classList.remove("open"); chatDock.classList.remove("open");
      }
      // 先处理跳转（若同时有 goto 和 scroll，先跳到目标页）
      if (el.dataset.goto) {
        const route = el.dataset.goto;
        // 若还要滚动到区块（如"城市地图"回到首页再滚到地图），跳转后延迟滚动
        if (el.dataset.scroll) {
          location.hash = route;
          setTimeout(() => {
            const sec = document.getElementById(el.dataset.scroll);
            if (sec) sec.scrollIntoView({ behavior: "smooth" });
          }, 80);
        } else {
          navigate(route);
        }
        return;
      }
      // 仅滚动到当前页区块
      if (el.dataset.scroll) {
        const sec = document.getElementById(el.dataset.scroll);
        if (sec) sec.scrollIntoView({ behavior: "smooth" });
      }
    });
    document.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const target = e.target.closest("[data-goto],[data-scroll]");
      if (!target) return;
      if (target.getAttribute("role") === "button" || target.tagName === "A") {
        e.preventDefault();
        if (target.dataset.goto) navigate(target.dataset.goto);
        else if (target.dataset.scroll) {
          const el = document.getElementById(target.dataset.scroll);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }

  /* ---------- 图标 ---------- */
  function snowflake(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="17" fill="#1E5AA8"/><path d="M18 4v28M6 12l24 12M6 24l24-12M11 18h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  function dotColor(id) {
    const map = { haerbin: "#C23B3B", yichun: "#2E8B57", daxinganling: "#7B4BB8" };
    return map[id] || "#1E5AA8";
  }
  /* AI 场景模板图标（Lucide 风格线条图标） */
  function templateIcon(kind) {
    const s = (d, extra = "") => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}${extra}</svg>`;
    const icons = {
      snow: `<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/>`,
      hot: `<path d="M12 3c-3 4-6 6.5-6 10a6 6 0 0 0 12 0c0-1.5-.5-3-1.5-4.5"/><path d="M9 15a3 3 0 0 1 6 0"/>`,
      forest: `<path d="M12 22V12M12 12L4 5M12 12l8-7M12 12V6"/>`,
      food: `<path d="M4 12h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8Z"/><path d="M12 8V4M9 4h6"/>`,
      sunrise: `<path d="M12 4v5M5 12h14M6 9l1.5 1.5M18 9l-1.5 1.5"/><path d="M4 17h16a4 4 0 0 1-8 2.5A4 4 0 0 1 4 17Z"/><path d="M9 20a3 3 0 0 0 6 0"/>`,
      north: `<path d="M12 2l6 9H6l6-9Z"/><path d="M12 11v9M12 14l-2 2M12 14l2 2"/><path d="M8 20h8"/>`,
      border: `<path d="M3 21h18M3 12h18M3 3h18"/><path d="M12 3v18"/>`,
      family: `<circle cx="9" cy="8" r="2.5"/><circle cx="16" cy="10" r="2"/><path d="M4 19c0-3 2.2-5 5-5s5 2 5 5M13 16c0-2 1.5-3.5 3.5-3.5S20 14 20 16"/>`,
      photo: `<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-5 4 4 3-3 6 6"/>`,
      slow: `<path d="M4 18h16"/><path d="M4 6h16"/><path d="M6 12h12"/>`,
      history: `<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 3"/><path d="M15 3h6v6"/>`,
      volcano: `<path d="M4 20L10 6l2 4 4-8 4 18Z"/>`,
      route: `<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18h5a4 4 0 0 0 0-8h-3a4 4 0 0 1 0-8h5.5"/>`
    };
    return s(icons[kind] || "");
  }

  /* ---------- 启动 ---------- */
  window.navigateTo = navigate; // 供地图区块点击调用

  function render() {
    // 切页时先停掉上一页的轮播，避免定时器残留（首页 5s 轮播不会带到城市/对话页）
    stopHeroSlides();
    const hash = location.hash.replace("#", "") || "home";
    /* 支持 #city/<id>/<档位>：由 AI 对话「查看路线图」跳转并定位 */
    const parts = hash.split("/");
    // 全局 html 有 scroll-behavior:smooth，切页必须显式 instant，否则会拖着上一页的滚动动画
    window.scrollTo({ top: 0, behavior: "instant" });
    const titles = {
      home: "北国龙江 · 黑龙江文旅门户",
      chat: "AI 旅行助手 · 北国龙江",
      feedback: "意见反馈 · 北国龙江",
      "feedback-admin": "意见汇总 · 北国龙江"
    };
    const c = parts[0] === "city" ? cityById(parts[1]) : null;
    document.title = c ? `${c.name} · 北国龙江` : (titles[hash] || titles.home);

    if (parts[0] === "city") {
      renderCity(parts[1], parts[2]);
    } else if (hash === "chat") {
      renderChatPage();
    } else if (hash === "feedback") {
      renderFeedbackPage();
    } else if (hash === "feedback-admin") {
      renderAdminPage();
    } else {
      renderHome();
      initHomeMap();
    }
  }

  /* 首页地图初始化（渲染完成后调用） */
  function initHomeMap() {
    const el = document.getElementById("hlj-map");
    if (!el) return;
    if (window.HLJMap && typeof window.HLJMap.initMap === "function") {
      window.HLJMap.initMap("hlj-map");
    } else {
      el.innerHTML = '<div class="map-fallback">地图服务加载中…</div>';
    }
  }

  window.addEventListener("hashchange", render);
  render();
  setupDock();
  bindGo();
})();
