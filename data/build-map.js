/* 生成前端地图 GeoJSON 数据文件 map-geo.js
 * 输入：china.json（全国省级）+ hl_province.json（黑龙江市级）
 * 输出：map-geo.js（window.GEO_CHINA 省级 + window.GEO_HL 市级，精简坐标）
 */
const fs = require("fs");

function slim(features, keepProps) {
  return features.map(f => {
    const p = {};
    keepProps.forEach(k => { if (f.properties[k] !== undefined) p[k] = f.properties[k]; });
    return { properties: p, geometry: f.geometry };
  });
}

const china = JSON.parse(fs.readFileSync(__dirname + "/china.json", "utf8"));
const hl = JSON.parse(fs.readFileSync(__dirname + "/hl_province.json", "utf8"));

const chinaSlim = slim(china.features, ["adcode", "name", "centroid"]);
const hlSlim = slim(hl.features, ["adcode", "name", "centroid"]);

const out = [
  "/* 北国龙江 · 地图行政区划数据（精简自阿里云 DataV GeoAtlas）",
  " * GEO_CHINA: 全国省级边界（背景灰底轮廓）",
  " * GEO_HL: 黑龙江 13 个地级市边界（彩色可点击区块）",
  " */",
  "window.GEO_CHINA = " + JSON.stringify(chinaSlim) + ";",
  "window.GEO_HL = " + JSON.stringify(hlSlim) + ";"
].join("\n");

fs.writeFileSync(__dirname + "/map-geo.js", out, "utf8");
console.log("done");
