import type { CollectionItem, GameEntry, PlayLog, StatCard } from "./types";

export const todayLogs: PlayLog[] = [
  {
    id: "log-stardew",
    gameTitle: "星露谷物语",
    dateLabel: "春 12 日",
    mood: "治愈",
    summary: "钓到一条金星鲈鱼，顺手把农场边角整理了。",
    detail: "今天适合慢慢玩，农场终于不像刚开荒那样乱了。"
  },
  {
    id: "log-honor",
    gameTitle: "王者荣耀",
    dateLabel: "3 局",
    mood: "想重开",
    summary: "大乔一胜两负，但最后一局传送配合很爽。",
    detail: "适合记录一下阵容和队友节奏，之后可以做轻复盘模板。"
  }
];

export const games: GameEntry[] = [
  {
    id: "game-stardew",
    title: "星露谷物语",
    platform: "steam",
    status: "playing",
    accentColor: "#0F766E",
    progress: "第 1 年春",
    note: "睡前慢慢推进，主线不急。",
    tags: ["种田", "钓鱼", "治愈"]
  },
  {
    id: "game-acnh",
    title: "集合啦！动物森友会",
    platform: "switch",
    status: "paused",
    accentColor: "#21A67A",
    progress: "岛建 68%",
    note: "想重做一片海边集市。",
    tags: ["岛建", "收集", "截图"]
  },
  {
    id: "game-splatoon",
    title: "斯普拉遁 3",
    platform: "switch",
    status: "playing",
    accentColor: "#FF6B3D",
    progress: "真格开放",
    note: "想记录武器手感和地图偏好。",
    tags: ["对战", "装备", "组队"]
  }
];

export const collectionItems: CollectionItem[] = [
  {
    id: "col-labubu",
    name: "海盐汽水款",
    series: "夏日系列",
    category: "盲盒",
    status: "已拥有",
    accentColor: "#35B8E0"
  },
  {
    id: "col-tape",
    name: "像素花园胶带",
    series: "手帐素材",
    category: "文具",
    status: "心愿",
    accentColor: "#F7B731"
  },
  {
    id: "col-amiibo",
    name: "喷射战士 amiibo",
    series: "游戏周边",
    category: "周边",
    status: "重复",
    accentColor: "#FF6B3D"
  }
];

export const stats: StatCard[] = [
  {
    label: "本月游玩",
    value: "12 天",
    hint: "比上月多 3 天"
  },
  {
    label: "正在玩",
    value: "4 款",
    hint: "2 款适合睡前"
  },
  {
    label: "收藏完成",
    value: "68%",
    hint: "夏日系列还差 2 款"
  }
];
