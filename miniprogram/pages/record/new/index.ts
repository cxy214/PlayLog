import { games as mockGames } from "../../../utils/mock";
import type { GameEntry, MoodTag } from "../../../utils/types";

// 从书架游戏转换为表单用的精简结构
interface SelectedGame {
  id: string;
  title: string;
  accentColor: string;
  platformLabel: string;
  progress: string;
  /** 来源：shelf = 书架已有，search = 搜索结果 */
  source: "shelf" | "search";
}

const MOODS: MoodTag[] = ["治愈", "上头", "想重开", "欧了", "肝完"];

const PLATFORM_LABEL: Record<string, string> = {
  switch: "Switch",
  steam: "Steam",
  mobile: "手游",
  other: "其他",
};

Page({
  data: {
    // 游戏选择
    searchQuery: "",
    searchResults: [] as any[],
    selectedGame: null as SelectedGame | null,
    shelfGames: [] as SelectedGame[],

    // 表单字段
    moods: MOODS,
    selectedMood: "" as MoodTag | "",
    summary: "",
    detail: "",
    progress: "",
    screenshots: [] as string[], // 本地临时路径

    // 状态
    saving: false,
    saveError: "",
  },

  onLoad() {
    // 把书架 mock 数据转成精简结构供快速选择
    const shelfGames: SelectedGame[] = mockGames.map((g: GameEntry) => ({
      id: g.id,
      title: g.title,
      accentColor: g.accentColor,
      platformLabel: PLATFORM_LABEL[g.platform] ?? g.platform,
      progress: g.progress,
      source: "shelf",
    }));
    this.setData({ shelfGames });
  },

  // ─── 游戏搜索 ───────────────────────────────────────────

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchQuery: e.detail.value });
  },

  async doSearch() {
    const query = this.data.searchQuery.trim();
    if (!query) return;

    wx.showLoading({ title: "搜索中…", mask: true });
    try {
      const res = await wx.cloud.callFunction({
        name: "searchGames",
        data: { query },
      });
      const results = (res.result as any)?.results ?? [];
      this.setData({ searchResults: results });
      if (results.length === 0) {
        wx.showToast({ title: "没找到相关游戏", icon: "none" });
      }
    } catch (err) {
      // 云函数未部署时降级提示
      wx.showToast({ title: "搜索暂不可用，请从书架选择", icon: "none", duration: 2500 });
    } finally {
      wx.hideLoading();
    }
  },

  selectSearchResult(e: WechatMiniprogram.TouchEvent) {
    const item = e.currentTarget.dataset.item as any;
    const selected: SelectedGame = {
      id: item.externalId,
      title: item.title,
      accentColor: "#5BAF85",
      platformLabel: item.platformLabel ?? "",
      progress: "",
      source: "search",
    };
    this.setData({
      selectedGame: selected,
      searchResults: [],
      searchQuery: "",
    });
  },

  selectShelfGame(e: WechatMiniprogram.TouchEvent) {
    const item = e.currentTarget.dataset.item as SelectedGame;
    this.setData({
      selectedGame: item,
      progress: item.progress, // 预填当前进度
    });
  },

  clearGame() {
    this.setData({ selectedGame: null, searchResults: [], searchQuery: "" });
  },

  // ─── 截图 ──────────────────────────────────────────────

  chooseImages() {
    const remain = 9 - this.data.screenshots.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const newPaths = res.tempFiles.map((f) => f.tempFilePath);
        this.setData({
          screenshots: [...this.data.screenshots, ...newPaths],
        });
      },
    });
  },

  removeImage(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number;
    const list = [...this.data.screenshots];
    list.splice(index, 1);
    this.setData({ screenshots: list });
  },

  // ─── 表单字段 ────────────────────────────────────────────

  selectMood(e: WechatMiniprogram.TouchEvent) {
    this.setData({ selectedMood: e.currentTarget.dataset.mood as MoodTag });
  },

  onSummaryInput(e: WechatMiniprogram.Input) {
    this.setData({ summary: e.detail.value });
  },

  onDetailInput(e: WechatMiniprogram.Input) {
    this.setData({ detail: e.detail.value });
  },

  onProgressInput(e: WechatMiniprogram.Input) {
    this.setData({ progress: e.detail.value });
  },

  // ─── 提交 ────────────────────────────────────────────────

  async submit() {
    const { selectedGame, selectedMood, summary, saving } = this.data;

    // 校验
    if (!selectedGame) {
      wx.showToast({ title: "请先选择游戏", icon: "none" }); return;
    }
    if (!selectedMood) {
      wx.showToast({ title: "选一个今天的感受吧", icon: "none" }); return;
    }
    if (!summary.trim()) {
      wx.showToast({ title: "写一句话记录吧", icon: "none" }); return;
    }
    if (saving) return;

    this.setData({ saving: true, saveError: "" });

    // 上传截图到云存储，获取 fileID 列表
    let imageFileIDs: string[] = [];
    const { screenshots } = this.data;
    if (screenshots.length > 0) {
      wx.showLoading({ title: "上传截图…", mask: true });
      try {
        const uploadTasks = screenshots.map((path, i) => {
          const ext = path.split(".").pop() ?? "jpg";
          const cloudPath = `playLogs/${Date.now()}_${i}.${ext}`;
          return wx.cloud.uploadFile({ cloudPath, filePath: path });
        });
        const results = await Promise.all(uploadTasks);
        imageFileIDs = results.map((r) => r.fileID);
      } catch (err) {
        console.error("截图上传失败", err);
        wx.hideLoading();
        this.setData({ saving: false, saveError: "截图上传失败，请重试" });
        return;
      }
      wx.hideLoading();
    }

    const record = {
      gameId: selectedGame.id,
      gameTitle: selectedGame.title,
      gameAccentColor: selectedGame.accentColor,
      mood: selectedMood,
      summary: summary.trim(),
      detail: this.data.detail.trim(),
      progress: this.data.progress.trim(),
      images: imageFileIDs,
      createdAt: new Date().toISOString(),
      // 云数据库会自动注入 _openid
    };

    try {
      const db = wx.cloud.database();
      await db.collection("playLogs").add({ data: record });

      wx.showToast({ title: "记录已保存 ✓", icon: "none", duration: 1500 });
      // 延迟返回，让 toast 显示完
      setTimeout(() => {
        wx.navigateBack();
      }, 1600);
    } catch (err: any) {
      console.error("保存失败", err);
      this.setData({
        saving: false,
        saveError: "保存失败，请检查云开发环境是否初始化",
      });
    }
  },
});
