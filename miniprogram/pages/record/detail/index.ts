import type { CloudPlayLog } from "../../../utils/types";

const MOOD_COLOR: Record<string, string> = {
  治愈: "#5BAF85",
  上头: "#D4896A",
  想重开: "#C9A84C",
  欧了: "#7B9EC9",
  肝完: "#A07BC9",
};

/** ISO → "M月D日 HH:MM" */
function fmtFull(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${month} 月 ${day} 日  ${h}:${m}`;
}

interface DetailData extends CloudPlayLog {
  dateLabel: string;
  moodColor: string;
  hasImages: boolean;
  previewIndex: number; // 当前大图预览索引，-1 = 不显示
}

Page({
  data: {
    log: null as DetailData | null,
    loading: true,
    notFound: false,
  },

  onLoad(options) {
    const id = options.id as string | undefined;
    if (!id) {
      this.setData({ loading: false, notFound: true });
      return;
    }
    this.fetchLog(id);
  },

  async fetchLog(id: string) {
    try {
      const db = wx.cloud.database();
      const res = await db.collection("playLogs").doc(id).get();
      const raw = res.data as CloudPlayLog;
      const log: DetailData = {
        ...raw,
        dateLabel: fmtFull(raw.createdAt),
        moodColor: MOOD_COLOR[raw.mood] ?? "#5BAF85",
        hasImages: Array.isArray(raw.images) && raw.images.length > 0,
        previewIndex: -1,
      };
      this.setData({ log, loading: false });
      wx.setNavigationBarTitle({ title: raw.gameTitle });
    } catch (err) {
      console.error("读取记录失败", err);
      this.setData({ loading: false, notFound: true });
    }
  },

  // ─── 大图预览 ────────────────────────────────────────────

  previewImage(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number;
    const urls = this.data.log?.images ?? [];
    wx.previewImage({ current: urls[index], urls });
  },

  // ─── 删除记录 ────────────────────────────────────────────

  confirmDelete() {
    wx.showModal({
      title: "删除记录",
      content: "确定要删除这条游玩记录吗？",
      confirmText: "删除",
      confirmColor: "#D4896A",
      success: (res) => {
        if (res.confirm) this.deleteLog();
      },
    });
  },

  async deleteLog() {
    const id = this.data.log?._id;
    if (!id) return;
    wx.showLoading({ title: "删除中…", mask: true });
    try {
      await wx.cloud.database().collection("playLogs").doc(id).remove();
      wx.hideLoading();
      wx.showToast({ title: "已删除", icon: "none", duration: 1200 });
      setTimeout(() => wx.navigateBack(), 1300);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: "删除失败，请重试", icon: "none" });
    }
  },
});
