Component({
  data: {
    selected: 0
  },

  methods: {
    switchTab(e: any) {
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