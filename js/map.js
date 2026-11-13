/* 北国龙江 · 静态政区图（纯 SVG + 墨卡托投影，不依赖任何在线地图 SDK）
 * 数据来源：阿里云 DataV GeoAtlas（公开行政区划 GeoJSON，见 data/map-geo.js）
 * - GEO_CHINA：全国省级边界 → 灰底轮廓（背景，突出黑龙江在全国的位置）
 * - GEO_HL：黑龙江 13 个地级市边界 → 彩色可点击区块（主体交互）
 * 点击黑龙江城市区块 → window.navigateTo("city/<id>")
 */
(function () {
  const HLJMap = {};

  /* 城市 id（沿用 data/cities.js 的 id）与 adcode 映射 */
  const ADCODE_TO_ID = {
    "230100": "haerbin", "230200": "qiqihaer", "230300": "jixi",
    "230400": "hegang", "230500": "shuangyashan", "230600": "daqing",
    "230700": "yichun", "230800": "jiamusi", "230900": "qitaihe",
    "231000": "mudanjiang", "231100": "heihe", "231200": "suihua",
    "232700": "daxinganling"
  };

  function districtColor(id) {
    const map = { haerbin: "#C23B3B", yichun: "#2E8B57", daxinganling: "#7B4BB8" };
    return map[id] || "#1E5AA8";
  }

  /* 城市名标签定向微调（投影后像素坐标，dx 右正 / dy 下正）。
   * 目标：每个标签都落在自己地块内、不压到相邻地块。
   * 标签锚点已改用「多边形外环顶点均值质心」（见 featureCenter），
   * 因此绝大多数城市无需额外偏移；仅大庆因地块呈「西窄东宽月牙形」需竖排。 */
  const LABEL_ADJUST = {
    shuangyashan: { dx: -5, dy: 3 }   // 双鸭山：向左下微调
  };

  /* 需要竖排标签的城市：地块垂直方向狭长、或形状不规则，横排文字易溢出边界。
   * 竖排每字只占一列（约一个字宽），可稳定收进自己地块内。 */
  const VERTICAL_LABELS = {
    daqing: true   // 大庆：西窄东宽月牙形，横排压东侧绥化西界
  };

  /* 墨卡托投影：经纬度 → 平面坐标（中国区域，固定缩放基准） */
  function mercator(lng, lat) {
    const x = lng;
    const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * 180 / Math.PI;
    return { x, y };
  }

  /* 计算一组 Feature 的经纬度外包范围 */
  function bounds(features) {
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
    const walk = (poly) => {
      poly.forEach(ring => ring.forEach(pt => {
        const lng = pt[0], lat = pt[1];
        if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      }));
    };
    features.forEach(f => {
      const g = f.geometry;
      if (!g) return;
      if (g.type === "Polygon") walk(g.coordinates);
      else if (g.type === "MultiPolygon") g.coordinates.forEach(walk);
    });
    return { minLng, maxLng, minLat, maxLat };
  }

  /* 把 Feature 的 geometry 转为 SVG path（GeoJSON 坐标是 [lng, lat]） */
  function geometryToPath(geometry, project) {
    if (!geometry) return "";
    const polyToPath = (poly) => {
      return poly.map(ring => {
        let d = "";
        ring.forEach((pt, i) => {
          const p = project(pt[0], pt[1]);
          d += (i === 0 ? "M" : "L") + p.x.toFixed(2) + " " + p.y.toFixed(2);
        });
        return d + "Z";
      }).join(" ");
    };
    if (geometry.type === "Polygon") return polyToPath(geometry.coordinates);
    if (geometry.type === "MultiPolygon") return geometry.coordinates.map(polyToPath).join(" ");
    return "";
  }

  /* 多边形视觉中心：用投影后外环顶点的均值质心。
   * 注意：GeoJSON 的 properties.centroid 常落在多边形 bbox 之外（飞地/不规则形状导致），
   * 直接用它会让标签压到相邻地块，故此处改用顶点均值，确保标签落在色块视觉中心。 */
  function featureCenter(feature, project) {
    const g = feature.geometry;
    const ring = g.type === "Polygon" ? g.coordinates[0] : (g.coordinates[0] ? g.coordinates[0][0] : null);
    if (!ring || !ring.length) return null;
    let sx = 0, sy = 0;
    ring.forEach(pt => { const p = project(pt[0], pt[1]); sx += p.x; sy += p.y; });
    return { x: sx / ring.length, y: sy / ring.length };
  }

  HLJMap.initMap = function (containerId, onReady) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!window.GEO_CHINA || !window.GEO_HL) {
      container.innerHTML = '<div class="map-fallback">地图数据加载中…</div>';
      return;
    }

    /* 以黑龙江 13 市的外包范围为准确定视野（主体是黑龙江） */
    const b = bounds(window.GEO_HL);
    const pad = 1.2;
    const cx = (b.minLng + b.maxLng) / 2;
    const cy = (b.minLat + b.maxLat) / 2;

    // 投影函数：先转墨卡托，再按视野缩放平移到容器
    const merc = (lng, lat) => mercator(lng, lat);
    const mc = merc(cx, cy);
    const mMin = merc(b.minLng, b.minLat);
    const mMax = merc(b.maxLng, b.maxLat);
    // 保持宽高比：取经度跨度为主要尺度（黑龙江东西跨度大）
    const spanX = (mMax.x - mMin.x) * pad;
    const spanY = (mMax.y - mMin.y) * pad;
    const W = container.clientWidth || 560;
    const H = container.clientHeight || 660;
    const scale = Math.min(W / spanX, H / spanY);

    function project(lng, lat) {
      const m = merc(lng, lat);
      return {
        x: (m.x - mc.x) * scale + W / 2,
        y: -(m.y - mc.y) * scale + H / 2
      };
    }

    // 全国省级边界 → 灰底轮廓（先画，垫底）
    const chinaPaths = window.GEO_CHINA.map(f => {
      const isHL = f.properties.name === "黑龙江省";
      return { path: geometryToPath(f.geometry, project), isHL, name: f.properties.name };
    });

    // 黑龙江 13 市 → 彩色区块
    const hlPaths = window.GEO_HL.map(f => {
      const id = ADCODE_TO_ID[String(f.properties.adcode)];
      const city = id ? (typeof CITIES !== "undefined" ? CITIES.find(c => c.id === id) : null) : null;
      return {
        id,
        path: geometryToPath(f.geometry, project),
        center: featureCenter(f, project),
        name: f.properties.name,
        color: id ? districtColor(id) : "#1E5AA8"
      };
    }).filter(x => x.id);

    // 组装 SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("class", "hlj-map-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "黑龙江行政区划图");

    // 1) 全国灰底轮廓（黑龙江除外）
    chinaPaths.forEach(cp => {
      if (cp.isHL) return;
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", cp.path);
      p.setAttribute("class", "china-prov");
      p.setAttribute("fill", "#E3EAF2");
      p.setAttribute("stroke", "#B9C6D6");
      p.setAttribute("stroke-width", "0.6");
      p.setAttribute("stroke-linejoin", "round");
      svg.appendChild(p);
    });

    // 2) 黑龙江 13 市彩色区块（可点击）
    const byId = {};
    hlPaths.forEach(c => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "hlj-city");
      g.setAttribute("data-city-id", c.id);
      g.setAttribute("role", "button");
      g.setAttribute("tabindex", "0");
      g.setAttribute("aria-label", "查看" + c.name + "介绍");

      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", c.path);
      p.setAttribute("fill", c.color);
      p.setAttribute("fill-opacity", "0.42");
      p.setAttribute("stroke", c.color);
      p.setAttribute("stroke-width", "1.2");
      p.setAttribute("stroke-linejoin", "round");
      g.appendChild(p);

      // 城市名标签（支持定向偏移 + 竖排）
      if (c.center) {
        const shortName = c.name.replace(/市$|地区$/, "");
        const adj = LABEL_ADJUST[c.id] || { dx: 0, dy: 0 };
        const lx = c.center.x + adj.dx;
        const ly = c.center.y + adj.dy;

        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", lx);
        t.setAttribute("y", ly);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("class", "hlj-city-label");

        if (VERTICAL_LABELS[c.id]) {
          // 竖排：逐字 tspan，每个字占一行
          const chars = shortName.split("");
          const lineHeight = 14;
          const startY = ly - (chars.length - 1) * lineHeight / 2;
          chars.forEach((ch, i) => {
            const ts = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            ts.setAttribute("x", lx);
            ts.setAttribute("dy", i === 0 ? startY - ly : lineHeight);
            ts.textContent = ch;
            t.appendChild(ts);
          });
        } else {
          t.textContent = shortName;
        }
        g.appendChild(t);
      }

      svg.appendChild(g);
      byId[c.id] = { city: c, el: g };
    });

    container.innerHTML = "";
    container.appendChild(svg);

    // 交互：悬浮高亮 + 点击跳转
    function highlight(id) {
      Object.keys(byId).forEach(k => {
        const g = byId[k].el;
        const p = g.querySelector("path");
        if (k === id) {
          p.setAttribute("fill-opacity", "0.75");
          p.setAttribute("stroke-width", "2.2");
          g.classList.add("active");
        } else {
          const c = byId[k].city;
          p.setAttribute("fill-opacity", "0.42");
          p.setAttribute("stroke-width", "1.2");
          g.classList.remove("active");
        }
      });
    }

    Object.keys(byId).forEach(k => {
      const g = byId[k].el;
      g.addEventListener("mouseenter", () => highlight(k));
      g.addEventListener("mouseleave", () => highlight(null));
      g.addEventListener("click", () => {
        if (typeof window.navigateTo === "function") window.navigateTo("city/" + k);
        else location.hash = "city/" + k;
      });
      g.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          if (typeof window.navigateTo === "function") window.navigateTo("city/" + k);
          else location.hash = "city/" + k;
        }
      });
    });

    // 图例提示
    const legend = document.createElement("div");
    legend.className = "map-legend";
    legend.innerHTML = '<span class="legend-dot hl"></span>黑龙江 13 城（可点击）<span class="legend-dot cn"></span>全国其他省（参考）';
    container.appendChild(legend);

    if (onReady) onReady({ byId });
    window.HLJMap.map = null;
    window.HLJMap.byId = byId;
    window.HLJMap.highlight = highlight;
  };

  window.HLJMap = HLJMap;
})();
