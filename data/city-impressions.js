/**
 * 13 城「风光印象」主图
 * 每城一张专属写实风光图，画面依据各城市真实地标特征绘制
 * （参考黑龙江省政府 / 文旅厅及公开文旅资料核对）。
 * 结构：{ 城市id: { img, place, desc } }
 *   img   —— 图片路径
 *   place —— 图注地标名
 *   desc  —— 无障碍描述 / 图片加载失败时的替代信息
 */
window.CITY_IMPRESSIONS = {
  haerbin: {
    img: "assets/impression/haerbin.png",
    place: "圣·索菲亚教堂 · 冬夜",
    desc: "冬夜飘雪中的圣·索菲亚教堂，拜占庭式红砖墙体与绿色洋葱头穹顶被暖黄灯光照亮"
  },
  qiqihaer: {
    img: "assets/impression/qiqihaer.png",
    place: "扎龙湿地 · 丹顶鹤",
    desc: "清晨金色阳光下的扎龙芦苇沼泽湿地，丹顶鹤展翅低飞于浅水河道之上"
  },
  mudanjiang: {
    img: "assets/impression/mudanjiang.png",
    place: "中国雪乡 · 雪夜",
    desc: "雪乡双峰林场的蓝调时刻，厚雪在木屋屋顶堆成雪蘑菇，屋檐红灯笼照亮雪径"
  },
  jiamusi: {
    img: "assets/impression/jiamusi.png",
    place: "华夏东极抚远 · 第一缕阳光",
    desc: "抚远黑龙江与乌苏里江交汇处的日出，朝霞染红江面与三江平原湿地，远处是东极宝塔剪影"
  },
  daqing: {
    img: "assets/impression/daqing.png",
    place: "龙凤湿地 · 百湖与磕头机",
    desc: "黄昏的松嫩平原，龙凤湿地芦苇湖泊与正在作业的油田抽油机相映，晚霞铺满水面"
  },
  jixi: {
    img: "assets/impression/jixi.png",
    place: "兴凯湖 · 界湖如海",
    desc: "夏季中俄界湖兴凯湖，湖面辽阔至地平线，细软沙滩上白色浪花轻拍岸边"
  },
  shuangyashan: {
    img: "assets/impression/shuangyashan.png",
    place: "挠力河湿地 · 九曲河湾",
    desc: "清晨俯瞰挠力河湿地，河流在三江平原草本沼泽中形成连续蜿蜒的河曲，白鹭掠起"
  },
  yichun: {
    img: "assets/impression/yichun.png",
    place: "小兴安岭 · 红松原始林",
    desc: "初秋清晨的五营红松原始林，晨雾浮动，金色阳光穿透高大红松与白桦形成光柱"
  },
  qitaihe: {
    img: "assets/impression/qitaihe.png",
    place: "户外冰场 · 速滑少年",
    desc: "冬日北方天然冰场，少年练习速度滑冰，雪堆、彩旗与覆雪的落叶松林环绕"
  },
  hegang: {
    img: "assets/impression/hegang.png",
    place: "龙江三峡 · 界江秋色",
    desc: "秋季龙江三峡界江峡谷，黑龙江在五花山秋色的两侧山体间转弯，江面倒映山影"
  },
  heihe: {
    img: "assets/impression/heihe.png",
    place: "五大连池 · 火山石海",
    desc: "五大连池世界地质公园，前景黑色块状熔岩石海，中景碧绿堰塞湖，远处缓坡状火山锥"
  },
  suihua: {
    img: "assets/impression/suihua.png",
    place: "寒地黑土 · 金色稻田",
    desc: "金秋寒地黑土农田，成熟的稻田铺展至地平线，联合收割机在整齐田块间作业"
  },
  daxinganling: {
    img: "assets/impression/daxinganling.png",
    place: "漠河北极村 · 雪夜木刻楞",
    desc: "中国最北的漠河北极村冬日黄昏，厚雪覆盖木刻楞小屋，窗内暖黄灯光与白桦林相映"
  }
};
