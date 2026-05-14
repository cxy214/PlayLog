import { games, stats, todayLogs } from "../../utils/mock";

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

Page({
  data: {
    dateLabel: "",
    games,
    stats,
    todayLogs
  },

  onLoad() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const week = WEEK_DAYS[now.getDay()];
    this.setData({ dateLabel: `${month} 月 ${day} 日  星期${week}` });
  },

  goNewRecord() {
    wx.navigateTo({ url: "/pages/record/new/index" });
  }
});
