import { games, stats } from "../../utils/mock";
import type { CloudPlayLog } from "../../utils/types";

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** ISO 字符串 → "HH:MM" */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** 云数据库记录 + 展示用字段 */
interface DisplayLog extends CloudPlayLog {
  timeLabel: string;   // "14:30"
  hasImages: boolean;
  imageCount: number;
}

Page({
  data: {
    dateLabel: "",
    games,
    stats,
    todayLogs: [] as DisplayLog[],
    logsLoading: false,
  },

  onLoad() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const week = WEEK_DAYS[now.getDay()];
    this.setData({ dateLabel: `${month} 月 ${day} 日  星期${week}` });
  },

  onShow() {
    this.fetchTodayLogs();
  },

  // ─── 从云数据库读取今日记录 ───────────────────────────────

  async fetchTodayLogs() {
    this.setData({ logsLoading: true });
    try {
      const db = wx.cloud.database();
      const _ = db.command;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const res = await db
        .collection("playLogs")
        .where({
          createdAt: _.gte(todayStart).and(_.lt(tomorrowStart)),
        })
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const todayLogs: DisplayLog[] = (res.data as CloudPlayLog[]).map((item) => ({
        ...item,
        timeLabel: fmtTime(item.createdAt),
        hasImages: Array.isArray(item.images) && item.images.length > 0,
        imageCount: Array.isArray(item.images) ? item.images.length : 0,
      }));

      this.setData({ todayLogs });
    } catch (err) {
      console.error("读取今日记录失败", err);
    } finally {
      this.setData({ logsLoading: false });
    }
  },

  // ─── 跳转 ────────────────────────────────────────────────

  goNewRecord() {
    wx.navigateTo({ url: "/pages/record/new/index" });
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/record/detail/index?id=${id}` });
  },
});
