// app.ts
App<IAppOption>({
  globalData: {
    language: 'en' // Default language
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // Load language preference
    const language = wx.getStorageSync('language') || 'en';
    // Store the language in globalData exactly as it is in storage
    this.globalData.language = language;

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
  onError(err: string) {
    wx.showToast({
      title: 'App Error Occurred',
      icon: 'none'
    });
    console.error('Global Error:', err);
  },
})