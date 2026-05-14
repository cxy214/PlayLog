export type GamePlatform = "switch" | "steam" | "mobile" | "other";

export type GameStatus = "playing" | "wishlist" | "finished" | "paused";

export type MoodTag = "治愈" | "上头" | "想重开" | "欧了" | "肝完";

export type GameEntry = {
  id: string;
  title: string;
  platform: GamePlatform;
  status: GameStatus;
  accentColor: string;
  progress: string;
  note: string;
  tags: string[];
};

export type PlayLog = {
  id: string;
  gameTitle: string;
  dateLabel: string;
  mood: MoodTag;
  summary: string;
  detail: string;
};

export type CollectionItem = {
  id: string;
  name: string;
  series: string;
  category: "盲盒" | "文具" | "周边";
  status: "已拥有" | "心愿" | "重复";
  accentColor: string;
};

export type StatCard = {
  label: string;
  value: string;
  hint: string;
};
