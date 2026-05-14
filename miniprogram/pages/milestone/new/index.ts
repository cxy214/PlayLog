import type { CloudGame, CloudMilestone, MilestoneType } from "../../../utils/types";

const MILESTONE_TYPES: MilestoneType[] = ["通关", "白金", "Boss击败", "剧情", "收集", "其他"];

const PLATFORM_LABEL: Record<string, string> = {
  switch: "Switch", steam: "Steam", mobile: "手游", other: "其他",
};

interface ShelfGame {
  id: string;
  title: string;
  accentColor: string;
  platformLabel: string;
}

Page({
  data: {
    // 游戏选择
    shelfGames: [] as ShelfGame[],
    selectedGame: null as ShelfGame | null,

    // 表单
    types: MILESTONE_TYPES,
    selectedType: "其他" as MilestoneType,
    title: "",
    note: "",
    screenshots: [] as string[],

    // 状态
    saving: false,
    saveError: "",
  },

  async onLoad() {
    await this.fetchShelfGames();
  },

  // ─── 读取书架 ─────────────────────────────────────────

  async fetchShelfGames() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection("games")
        .orderBy("updatedAt", "desc")
        .limit(50)
        .get();
      const shelfGames: ShelfGame[] = (res.data as CloudGame[]).map((g) => ({
        id: g._id,
        title: g.title,
        accentColor: g.accentColor,
        platformLabel: PLATFORM_LABEL[g.platform] ?? g.platform,
      }));
      this.setData({ shelfGames });
    } catch (err) {
      console.error("读取书架失败", err);
    }
  },

  // ─── 游戏选择 ─────────────────────────────────────────

  selectGame(e: WechatMiniprogram.TouchEvent) {
    const game = e.currentTarget.dataset.game as ShelfGame;
    this.setData({ selectedGame: game });
  },

  clearGame() {
    this.setData({ selectedGame: null });
  },

  // ─── 类型选择 ─────────────────────────────────────────

  selectType(e: WechatMiniprogram.TouchEvent) {
    this.setData({ selectedType: e.currentTarget.dataset.type as MilestoneType });
  },

  // ─── 表单输入 ─────────────────────────────────────────

  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ title: e.detail.value });
  },

  onNoteInput(e: WechatMiniprogram.Input) {
    this.setData({ note: e.detail.value });
  },

  // ─── 截图 ─────────────────────────────────────────────

  chooseImages() {
    const remain = 9 - this.data.screenshots.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const newPaths = res.tempFiles.map((f) => f.tempFilePath);
        this.setData({ screenshots: [...this.data.screenshots, ...newPaths] });
      },
    });
  },

  removeImage(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number;
    const list = [...this.data.screenshots];
    list.splice(index, 1);
    this.setData({ screenshots: list });
  },

  // ─── 提交 ─────────────────────────────────────────────

  async submit() {
    const { selectedGame, selectedType, title, saving } = this.data;

    if (!selectedGame) {
      wx.showToast({ title: "请先选择游戏", icon: "none" }); return;
    }
    if (!title.trim()) {
      wx.showToast({ title: "给这个里程碑起个名字吧", icon: "none" }); return;
    }
    if (saving) return;

    this.setData({ saving: true, saveError: "" });

    // 上传截图
    let imageFileIDs: string[] = [];
    const { screenshots } = this.data;
    if (screenshots.length > 0) {
      wx.showLoading({ title: "上传截图…", mask: true });
      try {
        const results = await Promise.all(
          screenshots.map((path, i) => {
            const ext = path.split(".").pop() ?? "jpg";
            return wx.cloud.uploadFile({
              cloudPath: `milestones/${Date.now()}_${i}.${ext}`,
              filePath: path,
            });
          })
        );
        imageFileIDs = results.map((r) => r.fileID);
      } catch (err) {
        wx.hideLoading();
        this.setData({ saving: false, saveError: "截图上传失败，请重试" });
        return;
      }
      wx.hideLoading();
    }

    const record: Omit<CloudMilestone, "_id"> = {
      gameId: selectedGame.id,
      gameTitle: selectedGame.title,
      gameAccentColor: selectedGame.accentColor,
      type: selectedType,
      title: title.trim(),
      note: this.data.note.trim(),
      images: imageFileIDs,
      createdAt: new Date().toISOString(),
    };

    try {
      await wx.cloud.database().collection("milestones").add({ data: record });
      wx.showToast({ title: "邮票已贴上 ✓", icon: "none", duration: 1200 });
      setTimeout(() => wx.navigateBack(), 1300);
    } catch (err) {
      console.error("保存失败", err);
      this.setData({ saving: false, saveError: "保存失败，请重试" });
    }
  },
});
