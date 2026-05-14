App<IAppOption>({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        // 替换成你在云开发控制台创建的环境 ID，格式如 playlog-prod-xxxxxxx
        env: 'cloud1-d7gb2cafj3601a8a8',
        traceUser: true
      });
    }
  },
  globalData: {}
});
