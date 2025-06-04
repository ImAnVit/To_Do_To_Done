Component({
  data: {
    selected: 0,
    color: '#666666',
    selectedColor: '#1296db',
    list: [
      {
        pagePath: "/pages/do/index",
        text: "DO"
      },
      {
        pagePath: "/pages/done/index",
        text: "DONE"
      },
      {
        pagePath: "/pages/profile/index",
        text: "PROFILE"
      }
    ]
  },
  lifetimes: {
    attached() {
      this.setData({
        selected: this.getTabBarIndex()
      });
    }
  },
  methods: {
    getTabBarIndex() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const url = `/${currentPage.route}`;
      const tabList = this.data.list;
      for (let i = 0; i < tabList.length; i++) {
        if (tabList[i].pagePath === url) {
          return i;
        }
      }
      return 0;
    },
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({
        url
      });
      this.setData({
        selected: data.index
      });
    }
  }
});
