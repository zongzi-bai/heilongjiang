/**
 * 旅游推荐 · 矢量路线示意图绘制
 *
 * 依据黑龙江省「五山一水一草三分田」地势与各城真实景区相对方位，
 * 用抽象地形底纹（山地分层设色 / 湿地河曲 / 湖泊 / 平原田格 / 火山熔岩 / 界江 / 街区）
 * 叠加站点折线，形成每城三档的路线示意图。
 *
 * 合规说明：这是设计示意插图，不使用任何在线地图瓦片或第三方地图服务，
 * 不绘制国界、不标注经纬度与敏感坐标，不可用于导航。
 */
window.TravelMap = (function () {
  const W = 1000, H = 420;
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  /* ---------- 公共底：天空、渐变、细网格 ---------- */
  function defs() {
    return `
      <defs>
        <linearGradient id="tmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#EEF5FB"/><stop offset="1" stop-color="#FAFCFE"/>
        </linearGradient>
        <linearGradient id="tmWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#C8E0F1"/><stop offset="1" stop-color="#9CC6E4"/>
        </linearGradient>
        <linearGradient id="tmLake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#B7D9EC"/><stop offset="1" stop-color="#7FB4D8"/>
        </linearGradient>
        <linearGradient id="tmField" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#E4EACB"/><stop offset="1" stop-color="#D3C79B"/>
        </linearGradient>
        <pattern id="tmGrid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0H0V50" fill="none" stroke="#C9D9E8" stroke-width="1" opacity=".35"/>
        </pattern>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#tmSky)"/>
      <rect width="${W}" height="${H}" fill="url(#tmGrid)"/>`;
  }

  /* 山脉分层设色：低浅绿 → 高深绿 → 雪线，模拟地形图的海拔色带 */
  function ridge(yBase, amp, fill, seed) {
    const s = seed || 0;
    return `<path d="M0 ${yBase + 40}
      L90 ${yBase - amp * 0.55 + s} L170 ${yBase + 4} L270 ${yBase - amp + s}
      L360 ${yBase + 18} L470 ${yBase - amp * 0.8} L570 ${yBase + 10}
      L680 ${yBase - amp * 0.65 + s} L780 ${yBase + 16} L880 ${yBase - amp * 0.9}
      L1000 ${yBase + 6} L1000 ${H} L0 ${H} Z" fill="${fill}"/>`;
  }
  function contours(color) {
    return [0, 1, 2, 3].map(i =>
      `<path d="M-20 ${165 + i * 34} C180 ${120 + i * 34}, 340 ${205 + i * 34}, 520 ${160 + i * 34} S820 ${120 + i * 34}, 1020 ${170 + i * 34}" fill="none" stroke="${color}" stroke-width="1.4" opacity=".55"/>`
    ).join("");
  }
  function pines(y, color, count, step) {
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = 30 + i * step;
      const h = 34 + (i % 4) * 9;
      out += `<path d="M${x} ${y} L${x - 13} ${y} L${x} ${y - h} L${x + 13} ${y} Z" fill="${color}" opacity=".8"/>`;
    }
    return out;
  }
  function reeds(color) {
    let out = "";
    for (let i = 0; i < 46; i++) {
      const x = 12 + i * 22;
      const y = 250 + (i % 5) * 24;
      const h = 16 + (i % 4) * 7;
      out += `<path d="M${x} ${y} q-3 -${h / 2} 1 -${h}" stroke="${color}" stroke-width="2" fill="none" opacity=".7"/>`;
    }
    return out;
  }

  /* ---------- 八类地形底纹 ---------- */
  function terrain(kind) {
    let g = "";
    if (kind === "city") {
      /* 松花江横带 + 江南街区网格 */
      g += `<path d="M0 168 C220 150 390 192 600 172 S860 152 1000 166 L1000 224 C840 238 660 214 470 230 S180 224 0 218 Z" fill="url(#tmWater)"/>`;
      g += `<path d="M0 196 C220 180 400 214 600 198 S860 180 1000 192" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>`;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 9; c++) {
          const x = 30 + c * 112 + (r % 2) * 22;
          const y = 250 + r * 56;
          const hh = 26 + ((c + r) % 3) * 12;
          g += `<rect x="${x}" y="${y - hh}" width="${58 + (c % 3) * 14}" height="${hh}" rx="3" fill="#C6D4E2" opacity=".72"/>`;
        }
      }
      g += `<path d="M0 244H1000M0 300H1000M0 356H1000" stroke="#fff" stroke-width="3" opacity=".7"/>`;
    } else if (kind === "plain" || kind === "farmland") {
      /* 低地平线 + 透视田格 */
      g += `<rect x="0" y="150" width="${W}" height="${H - 150}" fill="url(#tmField)"/>`;
      g += `<path d="M0 150H1000" stroke="#B6C79A" stroke-width="2"/>`;
      for (let i = -6; i <= 6; i++) {
        g += `<path d="M500 150 L${500 + i * 150} ${H}" stroke="#B9AE84" stroke-width="1.6" opacity=".65"/>`;
      }
      [190, 228, 272, 324, 386].forEach((y, i) => {
        g += `<path d="M0 ${y}H1000" stroke="#B9AE84" stroke-width="${1.2 + i * 0.3}" opacity=".6"/>`;
      });
      g += `<path d="M0 140 C160 130 260 146 420 138 S700 128 1000 142 L1000 152 L0 152 Z" fill="#CBDDBE" opacity=".8"/>`;
    } else if (kind === "wetland") {
      /* 芦苇沼泽 + 蜿蜒河曲 */
      g += `<rect x="0" y="120" width="${W}" height="${H - 120}" fill="#E4EEDB"/>`;
      g += `<path d="M-30 210 C140 150 210 300 380 250 S600 150 720 240 S900 320 1030 230 L1030 420 L-30 420 Z" fill="url(#tmWater)" opacity=".9"/>`;
      g += `<path d="M-30 260 C120 220 250 340 420 292 S640 210 760 300 S920 360 1030 300" fill="none" stroke="#8FB9DC" stroke-width="26" opacity=".55"/>`;
      g += `<path d="M-30 260 C120 220 250 340 420 292 S640 210 760 300 S920 360 1030 300" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>`;
      g += `<ellipse cx="200" cy="170" rx="150" ry="34" fill="#D6E5C4" opacity=".9"/>`;
      g += `<ellipse cx="760" cy="160" rx="180" ry="30" fill="#D6E5C4" opacity=".9"/>`;
      g += reeds("#7E9E6B");
    } else if (kind === "lake") {
      /* 远山 + 大湖面 + 波纹 */
      g += ridge(126, 34, "#D8E4DC", 0);
      g += `<path d="M0 205 C160 190 300 214 480 200 S780 188 1000 206 L1000 ${H} L0 ${H} Z" fill="url(#tmLake)"/>`;
      g += `<path d="M0 205 C160 190 300 214 480 200 S780 188 1000 206" fill="none" stroke="#E9D9B8" stroke-width="9" opacity=".9"/>`;
      for (let i = 0; i < 9; i++) {
        const y = 240 + i * 20;
        g += `<path d="M${40 + (i % 3) * 70} ${y} h${90 + (i % 4) * 45}" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>`;
      }
      g += `<path d="M0 300 C220 288 360 316 560 300 S820 286 1000 302" fill="none" stroke="#fff" stroke-width="1.6" opacity=".4"/>`;
    } else if (kind === "mountain") {
      /* 三层海拔色带 + 雪线 + 等高线 */
      g += ridge(215, 42, "#DCE9D6", 0);
      g += ridge(190, 66, "#B9D2B0", 8);
      g += ridge(160, 92, "#8FB79A", -6);
      g += `<path d="M235 118 L270 68 L305 118 Z M845 108 L880 58 L915 108 Z" fill="#F4F8FB" opacity=".95"/>`;
      g += contours("#FFFFFF");
      g += `<path d="M0 330 C240 306 420 348 640 322 S860 306 1000 326 L1000 420 L0 420 Z" fill="#C9DCBD" opacity=".8"/>`;
    } else if (kind === "forest") {
      /* 小兴安岭林海：山脊 + 多层松林剪影 */
      g += ridge(220, 40, "#DCE9D6", 0);
      g += ridge(195, 62, "#C1D8B8", 6);
      g += contours("#FFFFFF");
      g += pines(286, "#6E9B7C", 22, 46);
      g += pines(342, "#4E8265", 18, 57);
      g += `<path d="M0 360 Q250 340 500 358 T1000 352 L1000 420 L0 420 Z" fill="#A9C9A4" opacity=".85"/>`;
    } else if (kind === "volcano") {
      /* 火山锥 + 黑色熔岩石海 + 堰塞湖 */
      g += `<path d="M0 210 L300 210 L430 96 Q500 78 570 96 L700 210 L1000 210 L1000 420 L0 420 Z" fill="#7E8794"/>`;
      g += `<path d="M430 96 Q500 118 570 96 L700 210 L300 210 Z" fill="#5B6472"/>`;
      g += `<path d="M470 100 Q500 112 530 100" fill="none" stroke="#2E3742" stroke-width="5"/>`;
      g += `<ellipse cx="790" cy="300" rx="190" ry="62" fill="url(#tmLake)"/>`;
      g += `<ellipse cx="790" cy="300" rx="190" ry="62" fill="none" stroke="#5B8FAF" stroke-width="2" opacity=".7"/>`;
      for (let i = 0; i < 26; i++) {
        const x = 20 + (i * 71) % 620;
        const y = 245 + ((i * 37) % 150);
        g += `<rect x="${x}" y="${y}" width="${16 + (i % 3) * 8}" height="${12 + (i % 2) * 6}" rx="3" fill="#3B434E" opacity=".75" transform="rotate(${i % 5 * 7} ${x} ${y})"/>`;
      }
      g += `<path d="M0 224H1000" stroke="#39414C" stroke-width="3" opacity=".5"/>`;
    } else if (kind === "river") {
      /* 蜿蜒界江 + 两岸林带 */
      g += `<path d="M-40 60 C160 120 220 250 420 250 S640 110 760 190 S930 330 1040 300 L1040 420 L-40 420 Z" fill="#D7E6D2"/>`;
      g += `<path d="M-40 110 C150 170 230 300 430 300 S650 160 770 240 S940 380 1040 350 L1040 420 L-40 420 Z" fill="url(#tmWater)"/>`;
      g += `<path d="M-40 110 C150 170 230 300 430 300 S650 160 770 240 S940 380 1040 350" fill="none" stroke="#fff" stroke-width="2.5" opacity=".65"/>`;
      g += `<path d="M-40 60 C160 120 220 250 420 250 S640 110 760 190 S930 330 1040 300" fill="none" stroke="#9DBE95" stroke-width="3" opacity=".7"/>`;
      g += pines(96, "#7FA487", 14, 76);
      g += `<ellipse cx="880" cy="90" rx="120" ry="26" fill="#E7F0E1" opacity=".9"/>`;
    }
    return defs() + g;
  }

  /* ---------- 站点坐标：按档位给定基础走向，城市 id 做确定性微扰 ---------- */
  const BASE = {
    premium: [[110, 300], [295, 175], [495, 268], [700, 158], [885, 232]],
    photo:   [[140, 268], [330, 196], [515, 250], [705, 186], [875, 268]],
    budget:  [[165, 312], [345, 282], [520, 308], [695, 278], [860, 302]]
  };
  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 997 / 997;
  }
  function points(cityId, optId, n) {
    const base = BASE[optId] || BASE.photo;
    const seed = hash(cityId) * Math.PI * 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = base[i] || base[base.length - 1];
      out.push({
        x: Math.max(70, Math.min(930, Math.round(p[0] + Math.sin(seed + i * 1.7) * 12))),
        y: Math.max(110, Math.min(340, Math.round(p[1] + Math.cos(seed + i * 2.1) * 20)))
      });
    }
    return out;
  }

  /* ---------- 组装整张路线示意图 ---------- */
  function render(city, opt, option) {
    const stops = option.stops || [];
    const pts = points(city.id, opt.id, stops.length);
    const color = opt.color;
    const line = pts.map(p => `${p.x},${p.y}`).join(" ");

    const route = `
      <polyline points="${line}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
      <polyline points="${line}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 0"/>`;

    const nodes = pts.map((p, i) => {
      const above = i % 2 === 0;
      const ly = above ? p.y - 30 : p.y + 42;
      const name = esc(stops[i] ? stops[i].n : "");
      return `
        <circle cx="${p.x}" cy="${p.y}" r="19" fill="#fff" opacity=".95"/>
        <circle cx="${p.x}" cy="${p.y}" r="15" fill="${color}"/>
        <text x="${p.x}" y="${p.y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="Arial, sans-serif">${i + 1}</text>
        <text x="${p.x}" y="${ly}" text-anchor="middle" font-size="16" font-weight="600" fill="#17324F"
              stroke="#fff" stroke-width="5" paint-order="stroke" font-family="'Microsoft YaHei','PingFang SC',sans-serif">${name}</text>`;
    }).join("");

    return `
      <svg class="trip-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img"
           aria-label="${esc(city.name)}${esc(opt.label)}路线示意图：${esc(stops.map(s => s.n).join(" → "))}">
        ${terrain(city.terrain || "plain")}
        <rect x="0" y="0" width="${W}" height="${H}" fill="#fff" opacity=".06"/>
        ${route}
        ${nodes}
        <text x="24" y="30" font-size="15" font-weight="600" fill="#3A5670"
              stroke="#fff" stroke-width="4" paint-order="stroke" font-family="'Microsoft YaHei',sans-serif">地形 · ${esc(city.terrainLabel || "")}</text>
        <text x="${W - 24}" y="30" text-anchor="end" font-size="13" fill="#6C8096"
              stroke="#fff" stroke-width="4" paint-order="stroke" font-family="'Microsoft YaHei',sans-serif">路线示意 · 非导航地图</text>
      </svg>`;
  }

  return { render };
})();
