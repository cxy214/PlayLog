import type { CloudMilestone, MilestoneType } from "../../utils/types";

// 风格类型
type ViewStyle = "stamp" | "polaroid" | "film";

const STYLE_LABELS: Record<ViewStyle, string> = {
  stamp: "邮票",
  polaroid: "拍立得",
  film: "胶卷",
};

const STYLE_CYCLE: ViewStyle[] = ["stamp", "polaroid", "film"];

const TYPE_FILTERS = ["全部", "通关", "白金", "Boss击败", "剧情", "收集", "其他"] as const;
type FilterLabel = typeof TYPE_FILTERS[number];

/** ISO → "M/D" */
function fmtShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface DisplayMilestone extends CloudMilestone {
  dateShort: string;
  hasImage: boolean;
  firstImage: string;
}

Page({
  data: {
    viewStyle: "stamp" as ViewStyle,
    styleLabel: STYLE_LABELS["stamp"],
    filters: TYPE_FILTERS as unknown as string[],
    activeFilter: "全部" as FilterLabel,
    allMilestones: [] as DisplayMilestone[],
    milestones: [] as DisplayMilestone[],
    loading: false,
  },

  onLoad() {
    // 读取本地存储的风格偏好
    const saved = wx.getStorageSync("milestoneViewStyle") as ViewStyle | "";
    if (saved && STYLE_CYCLE.includes(saved)) {
      this.setData({ viewStyle: saved, styleLabel: STYLE_LABELS[saved] });
    }
  },

  onShow() {
    this.fetchMilestones();
  },

  // ─── 云数据库读取 ─────────────────────────────────────

  async fetchMilestones() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const res = await db
        .collection("milestones")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const allMilestones: DisplayMilestone[] = (res.data as CloudMilestone[]).map((m) => ({
        ...m,
        dateShort: fmtShort(m.createdAt),
        hasImage: Array.isArray(m.images) && m.images.length > 0,
        firstImage: Array.isArray(m.images) && m.images.length > 0 ? m.images[0] : "",
      }));

      this.setData({ allMilestones });
      this.applyFilter(this.data.activeFilter);
    } catch (err) {
      console.error("读取里程碑失败", err);
      wx.showToast({ title: "加载失败", icon: "none" });
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
    const milestones = filter === "全部"
      ? this.data.allMilestones
      : this.data.allMilestones.filter((m) => m.type === (filter as MilestoneType));
    this.setData({ milestones });
  },

  // ─── 风格切换 ─────────────────────────────────────────

  switchStyle() {
    const cur = this.data.viewStyle;
    const nextIndex = (STYLE_CYCLE.indexOf(cur) + 1) % STYLE_CYCLE.length;
    const next = STYLE_CYCLE[nextIndex];
    this.setData({ viewStyle: next, styleLabel: STYLE_LABELS[next] });
    wx.setStorageSync("milestoneViewStyle", next);
  },

  // ─── 跳转 ─────────────────────────────────────────────

  goNewMilestone() {
    wx.navigateTo({ url: "/pages/milestone/new/index" });
  },

  previewImage(e: WechatMiniprogram.TouchEvent) {
    const urls = e.currentTarget.dataset.urls as string[];
    const current = e.currentTarget.dataset.current as string;
    wx.previewImage({ current, urls });
  },
});
