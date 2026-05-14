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

/** 云数据库中存储的游戏（games 集合） */
export type CloudGame = {
  _id: string;
  title: string;
  platform: GamePlatform;
  status: GameStatus;
  accentColor: string;
  progress: string;
  note: string;
  tags: string[];
  coverUrl?: string;
  externalId?: string; // RAWG 来源时有值
  createdAt: string;
  updatedAt: string;
};

export type GameSearchResult = {
  externalId: string;
  source: "rawg";
  title: string;
  coverUrl?: string;
  platforms: string[];
  platformLabel: string;
  genres: string[];
  genreLabel: string;
  released?: string;
};

export type PlayLog = {
  id: string;
  gameTitle: string;
  dateLabel: string;
  mood: MoodTag;
  summary: string;
  detail: string;
};

/** 云数据库中存储的游玩记录（与 PlayLog 区分） */
export type CloudPlayLog = {
  _id: string;
  gameId: string;
  gameTitle: string;
  gameAccentColor: string;
  mood: MoodTag;
  summary: string;
  detail: string;
  progress: string;
  images: string[];
  createdAt: string; // ISO 字符串
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
