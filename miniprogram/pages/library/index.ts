import { games } from "../../utils/mock";
import type { GameEntry, GamePlatform, GameSearchResult } from "../../utils/types";

type SearchGamesResponse = {
  games?: GameSearchResult[];
  message?: string;
};

const platformMap: Record<string, GamePlatform> = {
  nintendo: "switch",
  switch: "switch",
  pc: "steam",
  steam: "steam",
  ios: "mobile",
  android: "mobile"
};

const resolvePlatform = (platforms: string[]): GamePlatform => {
  const normalized = platforms.join(" ").toLowerCase();
  const matchedKey = Object.keys(platformMap).find((key) => normalized.includes(key));

  return matchedKey ? platformMap[matchedKey] : "other";
};

const toGameEntry = (game: GameSearchResult): GameEntry => ({
  id: `rawg-${game.externalId}`,
  title: game.title,
  platform: resolvePlatform(game.platforms),
  status: "wishlist",
  accentColor: "#7BAE8B",
  progress: "想玩",
  note: game.released ? `发行于 ${game.released}` : "从游戏资料库添加",
  tags: game.genres.length > 0 ? game.genres.slice(0, 3) : ["新游戏"]
});

Page({
  data: {
    filters: ["在玩", "想玩", "已通关", "搁置"],
    activeFilter: "在玩",
    games,
    searchKeyword: "",
    searchResults: [] as GameSearchResult[],
    searchLoading: false,
    searchError: ""
  },

  onSearchInput(event: { detail: { value: string } }) {
    this.setData({
      searchKeyword: event.detail.value,
      searchError: ""
    });
  },

  onSearchGames() {
    const keyword = String(this.data.searchKeyword || "").trim();

    if (!keyword) {
      this.setData({
        searchError: "先输入一个游戏名试试"
      });
      return;
    }

    if (!wx.cloud) {
      this.setData({
        searchError: "当前环境还没有启用微信云开发"
      });
      return;
    }

    this.setData({
      searchLoading: true,
      searchError: "",
      searchResults: []
    });

    wx.cloud.callFunction<SearchGamesResponse>({
      name: "searchGames",
      data: { keyword },
      success: (res) => {
        const result = res.result || {};

        this.setData({
          searchResults: result.games || [],
          searchError: result.message || ""
        });
      },
      fail: () => {
        this.setData({
          searchError: "游戏资料暂时没有连上，稍后再试"
        });
      },
      complete: () => {
        this.setData({
          searchLoading: false
        });
      }
    });
  },

  onAddSearchResult(event: { currentTarget: { dataset: { index: number } } }) {
    const index = event.currentTarget.dataset.index;
    const selected = this.data.searchResults[index];

    if (!selected) {
      return;
    }

    const nextGame = toGameEntry(selected);
    const exists = this.data.games.some((game: GameEntry) => game.id === nextGame.id);

    if (exists) {
      wx.showToast({
        title: "已经在书架里了",
        icon: "none"
      });
      return;
    }

    this.setData({
      games: [nextGame, ...this.data.games],
      searchResults: [],
      searchKeyword: ""
    });

    wx.showToast({
      title: "已加入游戏书架",
      icon: "success"
    });
  }
});
