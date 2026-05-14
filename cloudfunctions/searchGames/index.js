const cloud = require("wx-server-sdk");
const https = require("https");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const RAWG_API_BASE = "https://api.rawg.io/api/games";

const requestJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`RAWG responded with ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });

const normalizeGame = (game) => {
  const platforms = Array.isArray(game.platforms)
    ? game.platforms.map((item) => item.platform && item.platform.name).filter(Boolean)
    : [];
  const genres = Array.isArray(game.genres) ? game.genres.map((item) => item.name).filter(Boolean) : [];
  const released = game.released || "";
  const genreLabel = [genres.join(" · ") || "暂无类型", released].filter(Boolean).join(" · ");

  return {
    externalId: String(game.id),
    source: "rawg",
    title: game.name,
    coverUrl: game.background_image || "",
    platforms,
    platformLabel: platforms.join(" / ") || "未知平台",
    genres,
    genreLabel,
    released
  };
};

exports.main = async (event) => {
  const keyword = String(event.keyword || "").trim();
  const apiKey = process.env.RAWG_API_KEY;

  if (!keyword) {
    return {
      games: [],
      message: "请输入游戏名"
    };
  }

  if (!apiKey) {
    return {
      games: [],
      message: "RAWG_API_KEY 未配置，请先在云函数环境变量中添加"
    };
  }

  const url = `${RAWG_API_BASE}?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(
    keyword
  )}&page_size=8`;

  try {
    const data = await requestJson(url);
    const results = Array.isArray(data.results) ? data.results : [];

    return {
      games: results.map(normalizeGame)
    };
  } catch (error) {
    console.error("searchGames failed", error);

    return {
      games: [],
      message: "游戏资料接口暂时不可用"
    };
  }
};
