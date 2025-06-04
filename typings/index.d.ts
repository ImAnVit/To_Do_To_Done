/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    language?: 'en' | 'zh' | 'zh_CN'
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}