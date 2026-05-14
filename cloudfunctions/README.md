# Cloud Functions

这里放微信云开发云函数。

## searchGames

`searchGames` 用 RAWG API 搜索游戏资料，供小程序“游戏书架”添加游戏时使用。

需要在微信云开发控制台给云函数配置环境变量：

```text
RAWG_API_KEY=你的 RAWG API Key
```

密钥不要写进小程序前端代码，也不要提交到仓库。
