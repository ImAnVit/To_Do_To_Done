const translations = {
  en: require('../locale/en/add-task.json'),
  zh: require('../locale/zh/add-task.json')
}

export function t(key: string): string {
  const app = getApp<IAppOption>()
  return translations[app.globalData.language][key] || key
}
