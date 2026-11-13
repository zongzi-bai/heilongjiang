/**
 * AI 推荐引擎
 * 架构：本地关键词匹配（默认、零依赖、实时）+ 大模型增强（可选，预留接口）
 *
 * - matchByKeywords: 加权关键词打分，命中城市标签 +2，命中名称 +5，命中别名 +8
 * - LLM 适配层：配置 window.HLJ_LLM_CONFIG 后可切换到大模型语义理解（fetch 占位实现）
 */
const Recommender = (() => {
  /* 同义词/别名扩展表：把口语化说法映射到标准关键词 */
  const ALIASES = {
    "看雪": ["雪", "雪乡", "冰雪"],
    "下雪": ["雪", "冰雪"],
    "滑雪": ["滑雪", "冰雪"],
    "泡温泉": ["温泉"],
    "温泉": ["温泉"],
    "避暑": ["避暑", "凉爽", "避暑", "22度"],
    "凉快": ["避暑", "凉爽"],
    "夏天": ["避暑", "凉爽", "湖光山色"],
    "吃": ["美食", "烤肉", "湖鲜", "锅包肉", "红肠"],
    "好吃": ["美食", "烤肉", "锅包肉", "红肠"],
    "拍照": ["摄影", "童话", "欧式"],
    "出片": ["摄影", "欧式", "童话"],
    "看日出": ["日出", "东极", "第一缕阳光"],
    "最北": ["最北", "北极村", "找北"],
    "极光": ["极光", "星空", "最北"],
    "带娃": ["亲子", "研学"],
    "孩子": ["亲子", "研学"],
    "便宜": ["低成本", "便宜", "小城"],
    "穷游": ["低成本", "便宜", "小城"],
    "人少": ["小众", "冷门", "小城"],
    "历史": ["历史", "二战", "古城遗址", "瑷珲", "挹娄"],
    "人文": ["历史", "非遗", "民俗", "博物馆"],
    "森林": ["森林", "氧吧", "红松", "林海"],
    "徒步": ["森林", "湿地", "山"],
    "边境": ["边境", "跨境", "俄罗斯", "界江"],
    "出国": ["跨境", "俄罗斯", "边境"],
    "俄罗斯": ["俄罗斯", "俄式", "边境", "跨境"],
    "温泉疗养": ["温泉", "康养"],
    "康养": ["温泉", "康养", "森林"],
    "自驾": ["湿地", "界江", "湖泊", "森林"],
    "工业": ["工业", "石油", "矿山", "铁人"],
    "观鸟": ["观鸟", "湿地", "丹顶鹤"],
    "鹤": ["丹顶鹤", "湿地"]
  };

  /* 扩展查询词：将口语映射为标准关键词集合 */
  function expandQuery(text) {
    const tokens = [];
    // 原文分词：把整句、2字词、城市名都纳入
    tokens.push(text);
    CITIES.forEach(c => {
      if (text.includes(c.name)) tokens.push(c.name);
    });
    Object.keys(ALIASES).forEach(k => {
      if (text.includes(k)) ALIASES[k].forEach(t => tokens.push(t));
    });
    // 长词优先，逐字滑窗提取 2~4 字词组
    for (let n = 4; n >= 2; n--) {
      for (let i = 0; i + n <= text.length; i++) tokens.push(text.slice(i, i + n));
    }
    return tokens;
  }

  /* 对单个城市打分 */
  function scoreCity(city, tokens) {
    let score = 0;
    const matched = [];
    tokens.forEach(tk => {
      if (!tk || tk.length < 1) return;
      // 城市名直击
      if (city.name.includes(tk) && tk.length >= 2) { score += 8; matched.push(tk); }
      // 关键词命中
      city.keywords.forEach(kw => {
        if (kw.includes(tk) || tk.includes(kw)) {
          const w = kw.length >= 3 ? 3 : 2;
          score += w; matched.push(kw);
        }
      });
      // 特色/描述泛匹配（弱权重）
      const blob = city.tag + city.desc + city.featureDesc;
      if (blob.includes(tk) && tk.length >= 2) { score += 1; }
    });
    return { city, score, matched: [...new Set(matched)].slice(0, 4) };
  }

  /* 本地推荐主流程 */
  function matchByKeywords(text) {
    const tokens = expandQuery(text);
    const ranked = CITIES.map(c => scoreCity(c, tokens))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
    return ranked.slice(0, 3);
  }

  /* ---------- 特色问答：回答「XX特色是什么 / 有什么特点」 ----------
   * 识别用户询问某个特色/景点的含义，返回 featureDetails 里的解释。
   * 返回 { type:"feature", answers:[{city, feature, text}] } 或 null。
   */
  const FEATURE_QUESTION = /(是什么|是什么样|有什么特点|特点是|啥是|是啥|有啥|啥意思|什么意思|介绍|怎么样|好不好玩|值得去吗|好玩吗|什么特色|有哪些特色|特色是什么|特点|有啥特色)/;

  function answerFeature(text) {
    if (!FEATURE_QUESTION.test(text)) return null;
    const answers = [];
    CITIES.forEach(c => {
      if (!c.featureDetails) return;
      Object.keys(c.featureDetails).forEach(f => {
        // 命中判定：用户输入包含特色名，或特色名包含用户提到的关键词（双向）
        // 提取用户输入中的 2 字以上实词片段，与特色名互相匹配
        const bare = f.replace(/近郊$|文化$|风情$|体验$/, "");
        let hit = text.includes(f);
        if (!hit) {
          // 特色名含用户词（如特色「极光白夜」vs 用户「极光」）
          for (let n = bare.length; n >= 2; n--) {
            for (let i = 0; i + n <= bare.length; i++) {
              const frag = bare.slice(i, i + n);
              if (text.includes(frag)) { hit = true; break; }
            }
            if (hit) break;
          }
        }
        if (hit) {
          answers.push({ city: c, feature: f, text: c.featureDetails[f] });
        }
      });
    });
    return answers.length ? { type: "feature", answers } : null;
  }

  /* ---------- 旅游路线问答 ----------
   * 识别「XX 怎么玩 / 三日游路线 / 规划行程 / 省钱路线」等问题，
   * 返回对应城市与档位的路线数据，前端据此渲染「查看路线图」跳转入口。
   * 优先级高于特色问答与普通城市推荐，避免「哈尔滨三日游怎么样」被当成特色解释。
   */
  const ROUTE_QUESTION = /(路线|线路|行程|怎么玩|怎么安排|怎么走|怎么排|攻略|玩几天|几天|规划|一日游|两日游|三日游|多日|安排一下)/;
  const TRIP_WORDS = [
    { id: "premium", re: /极致体验|极致|体验拉满|深度|高端|奢华|度假|不差钱|预算充足|全套/ },
    { id: "photo",   re: /拍照打卡|拍照|打卡|出片|摄影|机位|拍大片/ },
    { id: "budget",  re: /经济实惠|经济|实惠|省钱|便宜|穷游|低成本|预算有限|免费|不花钱/ }
  ];
  /* 地标 / 别名 → 城市 id，便于「雪乡三日游」「五大连池怎么玩」这类提问命中正确城市 */
  const CITY_HINTS = {
    "漠河": "daxinganling", "北极村": "daxinganling", "龙江第一湾": "daxinganling",
    "雪乡": "mudanjiang", "镜泊湖": "mudanjiang", "吊水楼": "mudanjiang", "横道河子": "mudanjiang",
    "扎龙": "qiqihaer", "丹顶鹤": "qiqihaer", "明月岛": "qiqihaer",
    "五大连池": "heihe", "瑷珲": "heihe", "老黑山": "heihe",
    "抚远": "jiamusi", "东极": "jiamusi", "黑瞎子岛": "jiamusi", "三江口": "jiamusi",
    "兴凯湖": "jixi", "珍宝岛": "jixi", "虎头": "jixi",
    "挠力河": "shuangyashan", "安邦河": "shuangyashan", "七星河": "shuangyashan",
    "红松": "yichun", "五营": "yichun", "汤旺河": "yichun", "金山鹿苑": "yichun",
    "龙凤湿地": "daqing", "连环湖": "daqing", "铁人": "daqing", "磕头机": "daqing",
    "龙江三峡": "hegang", "太平沟": "hegang", "鹤北": "hegang",
    "稻田公园": "suihua", "猛犸象": "suihua",
    "亚布力": "haerbin", "冰雪大世界": "haerbin", "中央大街": "haerbin", "索菲亚": "haerbin",
    "冠军馆": "qitaihe", "短道速滑": "qitaihe", "桃山湖": "qitaihe"
  };

  /* 没指定城市时，按档位挑三座代表性城市作为「热门方向」入口，避免硬猜一座城市 */
  const TIER_CITIES = {
    premium: ["haerbin", "mudanjiang", "daxinganling"],
    photo:   ["haerbin", "mudanjiang", "heihe"],
    budget:  ["haerbin", "yichun", "suihua"]
  };
  const SHOWCASE = [["haerbin", "premium"], ["mudanjiang", "photo"], ["yichun", "budget"]];

  function answerRoute(text) {
    if (!ROUTE_QUESTION.test(text)) return null;
    const opts = window.TRIP_OPTIONS || [];
    const recs = window.TRAVEL_RECOMMENDS || {};
    if (!opts.length || !Object.keys(recs).length) return null;

    /* 明确说了档位就只给该档；没说则三档全列，方便一次对比 */
    const wanted = TRIP_WORDS.filter(w => w.re.test(text)).map(w => w.id);

    /* 城市判定：全称 > 地标别名。路线问题不做偏好关键词猜城市——
     * 「经济实惠」「省钱」这类词会被打分算法误判成某座小城，反而给出错误路线。 */
    let city = CITIES.find(c => text.includes(c.name) || text.includes(c.name.replace(/地区$/, "")));
    let inferred = false;
    if (!city) {
      for (const k of Object.keys(CITY_HINTS)) {
        if (text.includes(k)) { city = CITIES.find(c => c.id === CITY_HINTS[k]); inferred = true; break; }
      }
    }

    /* 完全没提城市：给出几条热门方向，每条都能直达对应城市 + 档位的路线图 */
    if (!city) {
      const pairs = wanted.length
        ? (TIER_CITIES[wanted[0]] || SHOWCASE.map(p => p[0])).map(cid => [cid, wanted[0]])
        : SHOWCASE;
      const routes = pairs.map(([cid, oid]) => {
        const c = CITIES.find(x => x.id === cid);
        const opt = opts.find(o => o.id === oid);
        const option = recs[cid] && recs[cid].options[oid];
        return c && opt && option ? { city: c, optionId: oid, opt, option } : null;
      }).filter(Boolean);
      return routes.length
        ? { type: "route", routes, multi: !wanted.length, impliedByLandmark: false, noCity: true }
        : null;
    }

    const d = recs[city.id];
    if (!d) return null;
    const ids = wanted.length ? wanted : opts.map(o => o.id);
    const routes = ids.map(id => {
      const opt = opts.find(o => o.id === id);
      const option = d.options[id];
      return opt && option ? { city, optionId: id, opt, option } : null;
    }).filter(Boolean);
    return routes.length
      ? { type: "route", routes, multi: !wanted.length, impliedByLandmark: inferred, noCity: false }
      : null;
  }

  /* ---------- 大模型增强（可选） ----------
   * 若页面引入 window.HLJ_LLM_CONFIG = { endpoint, apiKey, model }
   * 则调用 chat completion 做语义推荐；否则自动回落本地匹配。
   */
  async function matchByLLM(text) {
    const cfg = window.HLJ_LLM_CONFIG;
    if (!cfg || !cfg.endpoint || !cfg.apiKey) return null;
    const sys = "你是黑龙江文旅推荐助手。用户会描述旅行偏好，请从以下城市中选出最匹配的1-3个并说明理由。" +
      CITIES.map(c => `${c.name}(${c.tag};标签:${c.keywords.join(",")})`).join("；") +
      '。严格返回 JSON: {"recommend":[{"city":"城市名","reason":"50字内"}]}';
    try {
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.apiKey },
        body: JSON.stringify({
          model: cfg.model || "gpt-4o-mini",
          messages: [{ role: "system", content: sys }, { role: "user", content: text }],
          temperature: 0.5
        })
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const json = JSON.parse(content.match(/\{[\s\S]*\}/)[0]);
      return json.recommend
        .map(r => {
          const city = CITIES.find(c => c.name.includes(r.city.replace(/市|地区$/, "")));
          return city ? { city, score: 99, matched: [r.reason.slice(0, 18)] } : null;
        })
        .filter(Boolean);
    } catch (e) {
      console.warn("LLM 调用失败，回落本地匹配", e);
      return null;
    }
  }

  /* 对外主入口：路线问答 > 特色问答 > LLM > 本地兜底 */
  async function recommend(text) {
    const ra = answerRoute(text);
    if (ra) return {
      source: "route", results: [], routeAnswers: ra.routes, routeMulti: ra.multi,
      routeNoCity: ra.noCity, routeByLandmark: ra.impliedByLandmark
    };
    const fa = answerFeature(text);
    if (fa) return { source: "feature", results: [], featureAnswers: fa.answers };
    const llm = await matchByLLM(text);
    if (llm && llm.length) return { source: "llm", results: llm };
    const local = matchByKeywords(text);
    return { source: "local", results: local };
  }

  return { recommend, matchByKeywords, answerFeature, answerRoute };
})();
