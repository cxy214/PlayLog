import { games } from "../../utils/mock";

Page({
  data: {
    filters: ["在玩", "想玩", "已通关", "搁置"],
    activeFilter: "在玩",
    games
  }
});
