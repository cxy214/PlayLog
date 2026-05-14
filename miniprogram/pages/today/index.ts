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

Page({
  data: {
    dateLabel: "",
    games,
    stats,
    todayLogs: [] as CloudPlayLog[],
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

      // 今日 0 点 ~ 明日 0 点
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

      this.setData({ todayLogs: res.data as CloudPlayLog[] });
    } catch (err) {
      console.error("读取今日记录失败", err);
    } finally {
      this.setData({ logsLoading: false });
    }
  },

  // ─── 工具方法（供 wxml 调用不到，挂在 data 上） ──────────

  fmtTime,

  goNewRecord() {
    wx.navigateTo({ url: "/pages/record/new/index" });
  },
});
