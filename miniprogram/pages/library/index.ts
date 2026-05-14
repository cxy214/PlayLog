import type { CloudGame, GamePlatform, GameSearchResult, GameStatus } from "../../utils/types";

// ─── 常量 ────────────────────────────────────────────────

const STATUS_FILTERS = ["全部", "在玩", "想玩", "已通关", "搁置"] as const;
type FilterLabel = typeof STATUS_FILTERS[number];

const FILTER_TO_STATUS: Record<FilterLabel, GameStatus | null> = {
  全部: null,
  在玩: "playing",
  想玩: "wishlist",
  已通关: "finished",
  搁置: "paused",
};

const STATUS_LABEL: Record<GameStatus, string> = {
  playing: "在玩",
  wishlist: "想玩",
  finished: "已通关",
  paused: "搁置",
};

const PLATFORM_LABEL: Record<GamePlatform, string> = {
  switch: "Switch",
  steam: "Steam",
  mobile: "手游",
  other: "其他",
};

// 莫兰迪色板，搜索结果添加时随机分配
const ACCENT_COLORS = ["#5BAF85", "#D4896A", "#C9A84C", "#7B9EC9", "#A07BC9", "#7BAFC9"];

const platformMap: Record<string, GamePlatform> = {
  nintendo: "switch", switch: "switch",
  pc: "steam", steam: "steam",
  ios: "mobile", android: "mobile",
};

function resolvePlatform(platforms: string[]): GamePlatform {
  const normalized = platforms.join(" ").toLowerCase();
  const key = Object.keys(platformMap).find((k) => normalized.includes(k));
  return key ? platformMap[key] : "other";
}

// ─── Page ────────────────────────────────────────────────

Page({
  data: {
    filters: STATUS_FILTERS as unknown as string[],
    activeFilter: "全部" as FilterLabel,
    allGames: [] as CloudGame[],      // 云数据库全量
    games: [] as CloudGame[],         // 当前筛选后展示
    loading: false,

    // 搜索
    searchKeyword: "",
    searchResults: [] as GameSearchResult[],
    searchLoading: false,
    searchError: "",

    // 展示用辅助字段（在 map 时注入）
    statusLabelMap: STATUS_LABEL,
    platformLabelMap: PLATFORM_LABEL,
  },

  onLoad() {
    this.fetchGames();
  },

  onShow() {
    // 从新建记录页返回时刷新（书架可能被新记录引用了新游戏）
    this.fetchGames();
  },

  // ─── 云数据库读取 ─────────────────────────────────────

  async fetchGames() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const res = await db
        .collection("games")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const allGames = res.data as CloudGame[];
      this.setData({ allGames });
      this.applyFilter(this.data.activeFilter);
    } catch (err) {
      console.error("读取书架失败", err);
      wx.showToast({ title: "书架加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  // ─── 筛选 ─────────────────────────────────────────────

  onFilterTap(e: WechatMiniprogram.TouchEvent) {
    const filter = e.currentTarget.dataset.filter as FilterLabel;
    if (filter === this.data.activeFilter) return;
    this.setData({ activeFilter: filter });
    this.applyFilter(filter);
  },

  applyFilter(filter: FilterLabel) {
    const status = FILTER_TO_STATUS[filter];
    const games = status
      ? this.data.allGames.filter((g) => g.status === status)
      : this.data.allGames;
    this.setData({ games });
  },

  // ─── 游戏搜索（云函数） ───────────────────────────────

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchKeyword: e.detail.value, searchError: "" });
  },

  async onSearchGames() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      this.setData({ searchError: "先输入一个游戏名试试" });
      return;
    }
    this.setData({ searchLoading: true, searchError: "", searchResults: [] });
    try {
      const res = await wx.cloud.callFunction({ name: "searchGames", data: { keyword } });
      const result = (res.result as any) || {};
      this.setData({
        searchResults: result.games || [],
        searchError: result.games?.length === 0 ? "没找到相关游戏" : "",
      });
    } catch {
      this.setData({ searchError: "游戏资料暂时没有连上，稍后再试" });
    } finally {
      this.setData({ searchLoading: false });
    }
  },

  clearSearch() {
    this.setData({ searchKeyword: "", searchResults: [], searchError: "" });
  },

  // ─── 添加游戏到书架（写云数据库） ────────────────────

  async onAddSearchResult(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number;
    const selected = this.data.searchResults[index];
    if (!selected) return;

    // 检查是否已在书架（按 externalId）
    const exists = this.data.allGames.some((g) => g.externalId === selected.externalId);
    if (exists) {
      wx.showToast({ title: "已经在书架里了", icon: "none" });
      return;
    }

    const now = new Date().toISOString();
    const accentColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    const newGame: Omit<CloudGame, "_id"> = {
      title: selected.title,
      platform: resolvePlatform(selected.platforms),
      status: "wishlist",
      accentColor,
      progress: "想玩",
      note: selected.released ? `发行于 ${selected.released}` : "从游戏资料库添加",
      tags: selected.genres.length > 0 ? selected.genres.slice(0, 3) : ["新游戏"],
      coverUrl: selected.coverUrl ?? "",
      externalId: selected.externalId,
      createdAt: now,
      updatedAt: now,
    };

    wx.showLoading({ title: "添加中…", mask: true });
    try {
      await wx.cloud.database().collection("games").add({ data: newGame });
      wx.hideLoading();
      wx.showToast({ title: "已加入书架", icon: "success" });
      this.setData({ searchResults: [], searchKeyword: "" });
      this.fetchGames();
    } catch (err) {
      wx.hideLoading();
      console.error("添加游戏失败", err);
      wx.showToast({ title: "添加失败，请重试", icon: "none" });
    }
  },

  // ─── 更新游戏状态 ─────────────────────────────────────

  onStatusChange(e: WechatMiniprogram.TouchEvent) {
    const { id, status } = e.currentTarget.dataset as { id: string; status: GameStatus };
    const statusList: GameStatus[] = ["playing", "wishlist", "finished", "paused"];
    const nextIndex = (statusList.indexOf(status) + 1) % statusList.length;
    const nextStatus = statusList[nextIndex];

    wx.cloud.database().collection("games").doc(id).update({
      data: { status: nextStatus, updatedAt: new Date().toISOString() },
    }).then(() => {
      const allGames = this.data.allGames.map((g) =>
        g._id === id ? { ...g, status: nextStatus } : g
      );
      this.setData({ allGames });
      this.applyFilter(this.data.activeFilter);
    }).catch(() => {
      wx.showToast({ title: "更新失败", icon: "none" });
    });
  },
});
