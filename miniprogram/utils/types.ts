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

/** 游戏里程碑 / 成就收藏（milestones 集合） */
export type MilestoneType = "通关" | "白金" | "Boss击败" | "剧情" | "收集" | "其他";

export type CloudMilestone = {
  _id: string;
  gameId: string;
  gameTitle: string;
  gameAccentColor: string;
  type: MilestoneType;
  title: string;       // 里程碑标题，如「击败最终 Boss」
  note: string;        // 备注
  images: string[];    // 截图 fileID
  createdAt: string;
};

export type StatCard = {
  label: string;
  value: string;
  hint: string;
};
