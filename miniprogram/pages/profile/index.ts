import eventBus from '../../utils/eventBus';
// Import our task management modules
const taskStorage = require('../../taskStorage');

Page({
  data: {
    notifications: false,
    language: 'en' as 'en' | 'zh_CN',
    activeTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    name: 'User',
    customName: '',
    isEditingName: false,
    avatarUrl: ''
  },

  onLoad() {
    this.loadSettings();
    this.updateTaskStats();
  },

  onShow() {
    this.updateTaskStats();
  },

  loadSettings() {
    const settings = wx.getStorageSync('settings') || {};
    const language = settings.language ?? 'en';
    const userName = settings.name ?? 'User';
    this.setData({
      notifications: settings.notifications ?? false,
      language: language,
      name: userName,
      avatarUrl: settings.avatarUrl || ''
    });
    // Apply language setting to the app
    this.applyLanguageSetting(language);
  },

  saveSettings() {
    wx.setStorageSync('settings', {
      notifications: this.data.notifications,
      language: this.data.language,
      name: this.data.name,
      avatarUrl: this.data.avatarUrl
    });
  },

  updateTaskStats() {
    try {
      // Use our taskStorage module to load tasks
      const tasks = taskStorage.loadTasks();
      
      // Ensure tasks is an array before using filter
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      const completed = tasksArray.filter((task: any) => task.isDone).length;
      const total = tasksArray.length;
      
      this.setData({
        activeTasks: total - completed,
        completedTasks: completed,
        totalTasks: total
      });
    } catch (error) {
      console.error('Error updating task stats:', error);
      // Set default values if there's an error
      this.setData({
        activeTasks: 0,
        completedTasks: 0,
        totalTasks: 0
      });
    }
  },

  resetTasks() {
    const self = this;
    wx.showModal({
      title: this.data.language === 'en' ? 'Reset All Tasks' : '重置所有任务',
      content: this.data.language === 'en' 
        ? 'Are you sure you want to reset all tasks? This action cannot be undone.'
        : '确定要重置所有任务吗？此操作无法撤消。',
      confirmText: this.data.language === 'en' ? 'Reset' : '重置',
      cancelText: this.data.language === 'en' ? 'Cancel' : '取消',
      success(res) {
        if (res.confirm) {
          // Use our taskStorage module to save an empty array
          taskStorage.saveTasks([]);
          self.updateTaskStats();
          wx.showToast({
            title: self.data.language === 'en' ? 'Tasks reset' : '任务已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  toggleNotifications() {
    const self = this;
    if (!this.data.notifications) {
      wx.requestSubscribeMessage({
        tmplIds: ['your-template-id'], // Replace with your actual template ID
        success: (res) => {
          if (res['your-template-id'] === 'accept') {
            self.setData({ notifications: true }, () => {
              self.saveSettings();
              wx.showToast({
                title: self.data.language === 'en' ? 'Notifications enabled' : '通知已启用',
                icon: 'success'
              });
            });
          }
        },
        fail: (err) => {
          console.error('Failed to subscribe to notifications:', err);
          wx.showToast({
            title: self.data.language === 'en' ? 'Failed to enable notifications' : '启用通知失败',
            icon: 'error'
          });
        }
      });
    } else {
      this.setData({
        notifications: false
      }, () => {
        this.saveSettings();
        wx.showToast({
          title: this.data.language === 'en' ? 'Notifications disabled' : '通知已禁用',
          icon: 'success'
        });
      });
    }
  },

  toggleLanguage() {
    const newLanguage = this.data.language === 'en' ? 'zh_CN' : 'en';
    this.setData({
      language: newLanguage
    }, () => {
      this.saveSettings();
      this.applyLanguageSetting(newLanguage);
      wx.showToast({
        title: newLanguage === 'en' ? 'Language: English' : '语言：中文',
        icon: 'success'
      });
    });
  },

  switchLanguage(_e: WechatMiniprogram.TouchEvent) {
    const newLanguage = this.data.language === 'en' ? 'zh_CN' : 'en';
    console.log('[DEBUG] Switching language to:', newLanguage);
    wx.setStorageSync('language', newLanguage);
    this.setData({ language: newLanguage }, () => {
      console.log('[DEBUG] Language updated in profile page');
      this.applyLanguageSetting(newLanguage);
      wx.showToast({
        title: newLanguage === 'en' ? 'Language: English' : '语言：中文',
        icon: 'success'
      });
    });
  },

  applyLanguageSetting(language: 'en' | 'zh_CN') {
    console.log('[DEBUG] Applying language setting:', language);
    getApp().globalData = getApp().globalData || {};
    getApp().globalData.language = language;
    
    // Emit language change event
    eventBus.emit('languageChanged', language);
    
    // Update tab bar text
    wx.setTabBarItem({
      index: 0,
      text: language === 'en' ? 'DO' : '待办'
    });
    wx.setTabBarItem({
      index: 1,
      text: language === 'en' ? 'DONE' : '已完成'
    });
    wx.setTabBarItem({
      index: 2,
      text: language === 'en' ? 'PROFILE' : '设置'
    });
  },

  onShareAppMessage() {
    if (getApp().globalData.isProfileSharing) {
      return {
        title: this.data.language === 'en' 
          ? 'Check out my profile!' 
          : '来看看我的个人资料！',
        path: '/pages/profile/index',
        imageUrl: '/assets/avatar-share.jpg'
      };
    }
    try {
      // Use our taskStorage module to load tasks
      const tasks = taskStorage.loadTasks();
      
      // Ensure tasks is an array before using filter
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      const remainingCount = tasksArray.filter((task: any) => !task.isDone).length;
      
      return {
        title: this.data.language === 'en' 
          ? `I have ${remainingCount} tasks to complete!` 
          : `我有${remainingCount}个待办任务！`,
        path: '/pages/do/index',
        imageUrl: '/assets/share-image.png' // You can add a share image to your assets folder
      };
    } catch (error) {
      console.error('Error in onShareAppMessage:', error);
      return {
        title: this.data.language === 'en' 
          ? 'Check out this app!' 
          : '来看看这个应用！',
        path: '/pages/do/index'
      };
    }
  },

  shareWithFriends() {
    // Check if running in Developer Tools
    const systemInfo = wx.getSystemInfoSync();
    const isDevTools = systemInfo.platform === 'devtools';
    
    if (isDevTools) {
      // Fallback for Developer Tools
      wx.showToast({
        title: this.data.language === 'en' ? 'Sharing is limited in Developer Tools' : '开发者工具中分享功能受限',
        icon: 'none',
        duration: 2000
      });
      
      // Simulate sharing with a modal
      wx.showModal({
        title: this.data.language === 'en' ? 'Share with Friends' : '分享给朋友',
        content: this.data.language === 'en' ? 'This is a simulated share in Developer Tools' : '这是开发者工具中的模拟分享',
        showCancel: false,
        confirmText: 'OK'
      });
    } else {
      // In real WeChat environment, use native sharing
      // First, set a flag to indicate we want to share the app
      getApp().globalData = getApp().globalData || {};
      getApp().globalData.isProfileSharing = true;
      
      // Trigger the native share sheet
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
      
      // Programmatically trigger the share button
      const shareButton = this.selectComponent('#shareButton');
      if (shareButton) {
        shareButton.triggerEvent('tap');
      } else {
        // Fallback if component selection fails
        wx.navigateToMiniProgram({
          appId: '', // Leave empty to just show share UI
          path: 'pages/do/index',
          success: () => {
            console.log('Share UI shown');
          },
          fail: (err) => {
            console.error('Failed to show share UI:', err);
            wx.showToast({
              title: this.data.language === 'en' ? 'Failed to share' : '分享失败',
              icon: 'none'
            });
          }
        });
      }
    }
  },

  handleGetProfile() {
    // Get user profile information
    wx.getUserProfile({
      desc: 'Used to personalize your experience',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          name: userInfo.nickName || this.data.name,
          avatarUrl: userInfo.avatarUrl || this.data.avatarUrl
        }, () => {
          this.saveSettings();
          wx.showToast({
            title: this.data.language === 'en' ? 'Profile updated' : '个人资料已更新',
            icon: 'success'
          });
        });
      },
      fail: (err) => {
        console.error('Failed to get user profile:', err);
        wx.showToast({
          title: this.data.language === 'en' ? 'Failed to get profile' : '获取个人资料失败',
          icon: 'error'
        });
      }
    });
  },

  startEditingName() {
    this.setData({
      isEditingName: true,
      customName: this.data.name
    });
  },

  updateName(e: any) {
    this.setData({
      customName: e.detail.value
    });
  },

  saveName() {
    if (this.data.customName.trim()) {
      this.setData({
        name: this.data.customName.trim(),
        isEditingName: false
      }, () => {
        this.saveSettings();
        wx.showToast({
          title: this.data.language === 'en' ? 'Name updated' : '名称已更新',
          icon: 'success'
        });
      });
    } else {
      wx.showToast({
        title: this.data.language === 'en' ? 'Name cannot be empty' : '名称不能为空',
        icon: 'error'
      });
    }
  },

  cancelEditName() {
    this.setData({
      isEditingName: false,
      customName: ''
    });
  },

  chooseAvatar() {
    // Show action sheet with options
    wx.showActionSheet({
      itemList: this.data.language === 'en' 
        ? ['Choose from Album', 'Use Default Avatar'] 
        : ['从相册选择', '使用默认头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // Choose from album
          this.chooseFromAlbum();
        } else if (res.tapIndex === 1) {
          // Use default avatar
          this.setData({
            avatarUrl: ''
          }, () => {
            this.saveSettings();
            wx.showToast({
              title: this.data.language === 'en' ? 'Default avatar set' : '已设置默认头像',
              icon: 'success'
            });
          });
        }
      }
    });
  },

  chooseFromAlbum() {
    // Check if running in WeChat environment or Developer Tools
    if (wx.chooseMedia) {
      try {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          camera: 'back',
          success: (res) => {
            const tempFilePath = res.tempFiles[0].tempFilePath;
            this.setData({
              avatarUrl: tempFilePath
            }, () => {
              this.saveSettings();
              wx.showToast({
                title: this.data.language === 'en' ? 'Avatar updated' : '头像已更新',
                icon: 'success'
              });
            });
          },
          fail: (err) => {
            console.error('Failed to choose media:', err);
            // Fallback for Developer Tools
            this.developerToolsFallback();
          }
        });
      } catch (error) {
        console.error('Error with chooseMedia API:', error);
        // Fallback for Developer Tools
        this.developerToolsFallback();
      }
    } else {
      // Fallback for older WeChat versions or Developer Tools
      this.developerToolsFallback();
    }
  },

  developerToolsFallback() {
    // Fallback implementation for Developer Tools
    wx.showToast({
      title: this.data.language === 'en' ? 'This feature is limited in Developer Tools' : '开发者工具中此功能受限',
      icon: 'none',
      duration: 2000
    });
    
    // Simulate choosing an image with a timeout
    setTimeout(() => {
      // Use the SVG version of the default avatar
      const defaultAvatarPath = '/assets/avatars/default-avatar.svg';
      
      this.setData({
        avatarUrl: defaultAvatarPath
      }, () => {
        this.saveSettings();
        wx.showToast({
          title: this.data.language === 'en' ? 'Avatar updated (simulated)' : '头像已更新（模拟）',
          icon: 'success'
        });
      });
    }, 1000);
  },
});