// Using CommonJS module format as required by the project
Page({
  data: {
    avatarUrl: '',
    name: '',
    language: 'en',
    activeTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    notifications: true,
    isSaving: false,
    isEditingName: false,
    tempName: '',
    userNumber: 0
  },

  onLoad: function() {
    // Generate a random user number between 1000 and 9999
    const userNumber = Math.floor(Math.random() * 9000) + 1000;
    
    // Set default name as "User XXXX"
    this.setData({
      userNumber: userNumber,
      name: `User ${userNumber}`
    });
    
    // Try to load profile from storage
    this.loadUserProfileFromStorage();
    this.loadTaskStats();
  },

  loadUserProfileFromStorage: function() {
    try {
      const userProfile = wx.getStorageSync('userProfile');
      if (userProfile) {
        // If profile exists in storage, use it
        this.setData({
          avatarUrl: userProfile.avatarUrl || '',
          name: userProfile.name || `User ${this.data.userNumber}`,
          language: userProfile.language || 'en',
          notifications: userProfile.notifications !== undefined ? userProfile.notifications : true
        });
      }
    } catch (e) {
      console.error('Failed to load user profile from storage:', e);
    }
  },

  loadUserProfile: function() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.setData({
          avatarUrl: res.userInfo.avatarUrl,
          name: res.userInfo.nickName,
          language: 'en',
          notifications: true,
        });
      },
      fail: (err) => {
        console.error('Failed to load user profile:', err)
      }
    })
  },

  handleGetProfile: function() {
    this.loadUserProfile()
  },

  loadTaskStats: function() {
    try {
      const taskStats = wx.getStorageSync('taskStats') || {};
      this.setData({
        activeTasks: taskStats.active || 0,
        completedTasks: taskStats.completed || 0,
        totalTasks: taskStats.total || 0,
      });
    } catch (e) {
      console.error('Failed to load task stats:', e);
    }
  },

  // Avatar selection method
  chooseAvatar: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({
          avatarUrl: res.tempFiles[0].tempFilePath
        });
        // Save the profile after avatar is updated
        this.saveUserProfile();
      }
    });
  },

  // Name input handling
  nameInput: function(e) {
    this.setData({
      name: e.detail.value
    });
  },

  // Start editing name when clicked
  startEditingName: function() {
    this.setData({
      isEditingName: true,
      tempName: this.data.name
    });
  },

  // Update name as user types
  updateName: function(e) {
    this.setData({
      name: e.detail.value
    });
  },

  // Save name changes
  saveName: function() {
    if (!this.data.name.trim()) {
      // If name is empty, revert to default name
      this.setData({
        name: `User ${this.data.userNumber}`,
        isEditingName: false
      });
    } else {
      this.setData({
        isEditingName: false
      });
    }
    // Save the profile after name is updated
    this.saveUserProfile();
  },

  // Cancel name editing
  cancelEditName: function() {
    this.setData({
      name: this.data.tempName,
      isEditingName: false
    });
  },

  saveUserProfile: function() {
    if (!this.data.name.trim()) {
      wx.showToast({
        title: 'Please enter your name',
        icon: 'none'
      });
      return;
    }

    this.setData({ isSaving: true });

    try {
      wx.setStorageSync('userProfile', {
        avatarUrl: this.data.avatarUrl,
        name: this.data.name,
        language: this.data.language,
        notifications: this.data.notifications
      });

      wx.showToast({
        title: 'Profile saved',
        icon: 'success'
      });
    } catch (e) {
      console.error('Failed to save user profile:', e);
      wx.showToast({
        title: 'Failed to save profile',
        icon: 'error'
      });
    } finally {
      this.setData({ isSaving: false });
    }
  },

  uploadAvatar: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // Show loading indicator
        wx.showLoading({
          title: this.data.language === 'en' ? 'Updating avatar...' : '更新头像中...',
        });
        
        // In a real app, you might upload the image to a server here
        // For this example, we'll just save the local path
        this.setData({
          avatarUrl: tempFilePath,
        }, () => {
          // Save the profile after avatar is updated
          this.saveUserProfile();
          wx.hideLoading();
        });
      },
      fail: (err) => {
        console.error('Failed to choose image:', err);
        wx.showToast({
          title: this.data.language === 'en' ? 'Failed to update avatar' : '更新头像失败',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },

  saveChanges: function() {
    this.setData({ isEditingName: false })
    wx.showToast({ title: 'Saved!' })
    this.saveUserProfile();
  },

  cancelEdit: function() {
    this.setData({
      isEditingName: false,
      name: this.data.tempName
    })
  },

  startEditing: function() {
    this.setData({
      isEditingName: true,
      tempName: this.data.name
    })
  },

  toggleNotifications: function() {
    this.setData({
      notifications: !this.data.notifications
    }, () => {
      this.saveUserProfile();
    });
  },
  
  switchLanguage: function(e) {
    const lang = e.currentTarget.dataset.lang === 'en' ? 'zh' : 'en';
    this.setData({
      language: lang
    }, () => {
      this.saveUserProfile();
      
      // Update app-wide language setting
      getApp().globalData.language = lang;
      
      // Save language to storage for app-wide access
      wx.setStorageSync('language', lang);
      
      // Broadcast language change to other pages
      const eventBus = require('../../utils/eventBus');
      eventBus.emit('languageChanged', lang);
      
      // Show confirmation
      wx.showToast({
        title: lang === 'en' ? 'Language changed' : '语言已更改',
        icon: 'success',
        duration: 1500
      });
    });
  },
  
  resetTasks: function() {
    wx.showModal({
      title: this.data.language === 'en' ? 'Confirm Reset' : '确认重置',
      content: this.data.language === 'en' ? 
        'Are you sure you want to reset all tasks? This cannot be undone.' : 
        '确定要重置所有任务吗？此操作无法撤销。',
      confirmText: this.data.language === 'en' ? 'Reset' : '重置',
      confirmColor: '#FF0000',
      success: (res) => {
        if (res.confirm) {
          // Reset task stats
          this.setData({
            activeTasks: 0,
            completedTasks: 0,
            totalTasks: 0
          });
          
          // Save to storage
          try {
            wx.setStorageSync('taskStats', {
              active: 0,
              completed: 0,
              total: 0
            });
            
            // Clear tasks from storage
            wx.setStorageSync('tasks', []);
            
            wx.showToast({
              title: this.data.language === 'en' ? 'Tasks reset' : '任务已重置',
              icon: 'success',
              duration: 2000
            });
          } catch (e) {
            console.error('Failed to reset tasks:', e);
          }
        }
      }
    });
  },
  
  shareWithFriends: function() {
    // This function will trigger the open-type="share" button
    wx.showToast({
      title: this.data.language === 'en' ? 'Opening share menu...' : '打开分享菜单...',
      icon: 'none',
      duration: 1000
    });
  },
  
  onShareAppMessage: function() {
    return {
      title: this.data.language === 'en' ? 'Check out this awesome task app!' : '看看这个很棒的任务应用！',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.png' // Optional share image
    };
  }
});
