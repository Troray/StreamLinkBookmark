document.addEventListener('DOMContentLoaded', function() {
  try {
    // 获取所有tab元素
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');

    // 使用原生方式处理tab切换
    tabElements.forEach(tabEl => {
      tabEl.addEventListener('click', function(event) {
        event.preventDefault();
        
        // 移除所有tab的active类
        tabElements.forEach(tab => {
          tab.classList.remove('active');
          const pane = document.querySelector(tab.dataset.bsTarget);
          if (pane) {
            pane.classList.remove('show', 'active');
          }
        });
        
        // 激活当前tab
        this.classList.add('active');
        const targetPane = document.querySelector(this.dataset.bsTarget);
        if (targetPane) {
          targetPane.classList.add('show', 'active');
        }
      });
    });

    const roomInput = document.getElementById('roomInput');
    const parseBtn = document.getElementById('parseBtn');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const streamTitle = document.getElementById('streamTitle');
    const userCount = document.getElementById('userCount');
    const streamLinks = document.getElementById('streamLinks');
    const streamerAvatar = document.getElementById('streamerAvatar');
    const streamerName = document.getElementById('streamerName');
    const addToFavorites = document.getElementById('addToFavorites');
    const favoritesList = document.getElementById('favoritesList');
    const noFavorites = document.getElementById('noFavorites');
    const checkAllStatus = document.getElementById('checkAllStatus');

    // 点击解析按钮
    parseBtn.addEventListener('click', () => {
      const input = roomInput.value.trim();
      const roomId = extractRoomId(input);
      if (roomId) {
        parseRoom(roomId);
      } else {
        result.classList.add('d-none');
        error.textContent = '请输入正确的房间号或直播间链接';
        error.classList.remove('d-none');
      }
    });

    // 回车触发解析
    roomInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        parseBtn.click();
      }
    });

    // 加载常用直播间
    function loadFavorites() {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      browserAPI.storage.local.get('favorites').then(result => {
        const favorites = result.favorites || [];
        
        favoritesList.innerHTML = '';
        if (favorites.length === 0) {
          noFavorites.classList.remove('d-none');
        } else {
          noFavorites.classList.add('d-none');
          favorites.forEach(favorite => {
            const item = document.createElement('div');
            item.className = 'list-group-item py-2';  // 减少上下内边距
            item.setAttribute('data-room-id', favorite.roomId);
            
            // 上半部分：头像、名称和状态标签
            const topRow = document.createElement('div');
            topRow.className = 'd-flex align-items-center';  // 移除mb-2，减少垂直间距
            
            const leftContent = document.createElement('div');
            leftContent.className = 'd-flex align-items-center flex-grow-1 overflow-hidden';  // 添加overflow-hidden
            
            const avatar = document.createElement('img');
            avatar.src = favorite.avatar;
            avatar.className = 'rounded-circle me-2 flex-shrink-0';
            avatar.style.width = '32px';  // 减小头像尺寸
            avatar.style.height = '32px';
            avatar.style.cursor = 'pointer';
            avatar.onclick = () => window.open(`https://www.douyin.com/user/${favorite.secUid}`, '_blank');
            
            const info = document.createElement('div');
            info.className = 'd-flex flex-column min-w-0';  // 添加min-w-0允许内容收缩
            
            const nameRow = document.createElement('div');
            nameRow.className = 'd-flex align-items-center';
            
            const name = document.createElement('strong');
            name.className = 'text-truncate';
            name.style.maxWidth = '200px';
            name.style.cursor = 'pointer';
            name.textContent = favorite.nickname;
            name.onclick = () => window.open(`https://www.douyin.com/user/${favorite.secUid}`, '_blank');
            // 移除链接颜色和下划线相关样式
            name.style.color = 'inherit';  // 使用默认文本颜色
            
            const statusBadge = document.createElement('span');
            statusBadge.className = 'd-none status-badge ms-2';
            statusBadge.style.fontSize = '14px';
            
            // 添加鼠标事件处理
            statusBadge.addEventListener('mouseenter', (e) => {
              const tooltip = document.createElement('div');
              tooltip.className = 'custom-tooltip';
              tooltip.textContent = statusBadge.dataset.status || '未检测';
              
              // 计算位置
              const rect = e.target.getBoundingClientRect();
              tooltip.style.top = `${rect.bottom + 5}px`;
              tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
              tooltip.style.transform = 'translateX(-50%)';
              
              document.body.appendChild(tooltip);
              // 强制重绘
              tooltip.offsetHeight;
              tooltip.style.opacity = '1';
            });

            statusBadge.addEventListener('mouseleave', () => {
              const tooltip = document.querySelector('.custom-tooltip');
              if (tooltip) {
                tooltip.style.opacity = '0';
                setTimeout(() => tooltip.remove(), 200);
              }
            });
            
            nameRow.appendChild(name);
            nameRow.appendChild(statusBadge);
            
            const roomId = document.createElement('small');
            roomId.className = 'text-muted text-truncate';
            roomId.style.fontSize = '12px';  // 减小字体大小

            // 创建"房间号："文本节点
            const roomIdLabel = document.createTextNode('房间号：');
            roomId.appendChild(roomIdLabel);

            // 创建房间号链接
            const roomIdLink = document.createElement('a');
            roomIdLink.href = `https://live.douyin.com/${favorite.roomId}`;
            roomIdLink.textContent = favorite.roomId;
            roomIdLink.target = '_blank';  // 在新标签页打开
            roomIdLink.style.color = 'inherit';  // 继承父元素的颜色
            roomIdLink.style.textDecoration = 'none';  // 移除下划线
            roomIdLink.addEventListener('mouseenter', () => {
              roomIdLink.style.textDecoration = 'underline';  // 鼠标悬停时显示下划线
            });
            roomIdLink.addEventListener('mouseleave', () => {
              roomIdLink.style.textDecoration = 'none';  // 鼠标离开时移除下划线
            });

            roomId.appendChild(roomIdLink);
            info.appendChild(nameRow);  // 保持这行,确保nameRow先添加
            info.appendChild(roomId);   // 然后添加roomId
            
            leftContent.appendChild(avatar);
            leftContent.appendChild(info);
            
            // 按钮组
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group flex-shrink-0';
            btnGroup.style.marginLeft = '8px';  // 添加左边距
            
            const parseBtn = document.createElement('button');
            parseBtn.className = 'btn btn-sm btn-primary py-0 px-2';  // 减少内边距
            parseBtn.style.fontSize = '12px';  // 减小字体大小
            parseBtn.textContent = '解析';
            parseBtn.onclick = () => {
              roomInput.value = favorite.roomId;
              document.getElementById('parse-tab').click();
              parseRoom(favorite.roomId);
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger py-0 px-2';  // 减少内边距
            deleteBtn.style.fontSize = '12px';  // 减小字体大小
            deleteBtn.textContent = '删除';
            deleteBtn.onclick = () => removeFavorite(favorite.roomId);
            
            btnGroup.appendChild(parseBtn);
            btnGroup.appendChild(deleteBtn);
            
            // 组装
            topRow.appendChild(leftContent);
            topRow.appendChild(btnGroup);
            item.appendChild(topRow);
            
            favoritesList.appendChild(item);
          });
        }
      }).catch(err => {
        console.error('加载我的收藏失败:', err);
      });
    }

    // 添加到常用直播间
    async function addFavorite(roomInfo, originalRoomId) {
      const favorite = {
        roomId: originalRoomId,
        nickname: roomInfo.owner.nickname,
        avatar: roomInfo.owner.avatar_thumb.url_list[0],
        secUid: roomInfo.owner.sec_uid
      };
      
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      const result = await browserAPI.storage.local.get('favorites');
      const favorites = result.favorites || [];
      
      if (!favorites.some(f => f.roomId === favorite.roomId)) {
        favorites.push(favorite);
        await browserAPI.storage.local.set({ favorites });
        
        // 立即更新按钮状态
        addToFavorites.textContent = '已收藏';
        addToFavorites.disabled = true;
        addToFavorites.classList.remove('btn-outline-primary');
        addToFavorites.classList.add('btn-secondary');
        
        loadFavorites();
        showToast('已添加到我的收藏');
      } else {
        showToast('该直播间已在收藏列表中');
      }
    }

    // 从常用直播间中移除
    async function removeFavorite(roomId) {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      const result = await browserAPI.storage.local.get('favorites');
      const favorites = result.favorites || [];
      const newFavorites = favorites.filter(f => f.roomId !== roomId);
      await browserAPI.storage.local.set({ favorites: newFavorites });
      loadFavorites();
      showToast('已从我的收藏移除');
    }

    // 显示提示信息
    function showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'copy-toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }

    // 从URL中提取房间号
    function extractRoomId(input) {
      if (!input) return '';
      // 如果是完整URL
      if (input.includes('live.douyin.com')) {
        const match = input.match(/live\.douyin\.com\/(\d+)/);
        return match ? match[1] : '';
      }
      // 如果是www.douyin.com/root/live/格式
      if (input.includes('douyin.com/root/live/')) {
        const match = input.match(/\/root\/live\/(\d+)/);
        return match ? match[1] : '';
      }
      // 如果只是房间号
      if (/^\d+$/.test(input)) {
        return input;
      }
      return '';
    }

    // 复制文本到剪贴板
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = '已复制到剪贴板';
        document.body.appendChild(toast);
        
        // 使用requestAnimationFrame确保DOM更新后再添加show类
        requestAnimationFrame(() => {
          toast.classList.add('show');
        });
        
        setTimeout(() => {
          toast.classList.remove('show');
          // 等待淡出动画完成后移除元素
          setTimeout(() => toast.remove(), 300);
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
      });
    }

    // 修改createStreamLinkElement函数，为不同格式设置不同颜色
    function createStreamLinkElement(quality, url, format) {
      const div = document.createElement('div');
      div.className = 'list-group-item d-flex justify-content-between align-items-center stream-link';
      div.style.cssText = 'white-space: nowrap; overflow: hidden;';
      
      const qualitySpan = document.createElement('span');
      qualitySpan.className = 'badge bg-primary me-2';
      qualitySpan.textContent = quality;
      
      const formatSpan = document.createElement('span');
      // 为不同格式设置不同的颜色
      formatSpan.className = `badge me-2 ${format === 'FLV' ? 'bg-info' : 'bg-success'}`;
      formatSpan.textContent = format;
      
      const linkSpan = document.createElement('span');
      linkSpan.className = 'flex-grow-1 mx-2';
      linkSpan.style.cssText = 'text-overflow: ellipsis; overflow: hidden;';
      linkSpan.title = url;
      linkSpan.textContent = url;
      
      const copyIcon = document.createElement('img');
      copyIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY3VycmVudENvbG9yIiBjbGFzcz0iYmkgYmktY2xpcGJvYXJkIiB2aWV3Qm94PSIwIDAgMTYgMTYiPjxwYXRoIGQ9Ik00IDFhMSAxIDAgMCAxIDEtMWg1YTEgMSAwIDAgMSAxIDF2MWgyYTEgMSAwIDAgMSAxIDF2MTJhMSAxIDAgMCAxLTEgMUgzYTEgMSAwIDAgMS0xLTFWM2ExIDEgMCAwIDEgMS0xaDJ2LTF6bTIgMGgzdjFINlYxem03IDN2MTBIMy4wMDFWNEgxM3ptLTktMUg0djFIMlYzaDJ6Ii8+PC9zdmc+';
      copyIcon.className = 'copy-icon';
      copyIcon.title = '复制链接';
      copyIcon.onclick = () => copyToClipboard(url);
      
      div.appendChild(qualitySpan);
      div.appendChild(formatSpan);
      div.appendChild(linkSpan);
      div.appendChild(copyIcon);
      
      return div;
    }

    // 添加检查是否已收藏的函数
    async function isRoomFavorited(roomId) {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      const result = await browserAPI.storage.local.get('favorites');
      const favorites = result.favorites || [];
      return favorites.some(f => f.roomId === roomId);
    }

    // 修改parseRoom函数
    async function parseRoom(roomId) {
      try {
        // 补全URL显示
        const fullUrl = `https://live.douyin.com/${roomId}`;
        roomInput.value = fullUrl;

        const response = await fetch(`https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=120.0.0.0&web_rid=${roomId}`, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://live.douyin.com',
            'Referer': `https://live.douyin.com/${roomId}`
          }
        });

        const data = await response.json();

        if (!data.data || !data.data.data || data.data.data.length === 0) {
          throw new Error('直播间不存在');
        }

        const roomInfo = data.data.data[0];
        
        // 获取主播信息（从正确的位置）
        const userInfo = roomInfo.status === 2 ? roomInfo.owner : data.data.user;
        
        // 显示主播信息（无论是否开播都显示）
        streamerAvatar.src = userInfo.avatar_thumb.url_list[0];
        streamerName.textContent = userInfo.nickname;
        streamerName.href = `https://www.douyin.com/user/${userInfo.sec_uid}`;

        // 显示在线人数（如果有）
        if (roomInfo.user_count_str && roomInfo.user_count_str !== '0') {
          userCount.textContent = roomInfo.user_count_str;
          userCount.classList.remove('d-none');
        } else {
          userCount.classList.add('d-none');
        }

        // 检查是否已收藏
        const isFavorited = await isRoomFavorited(roomId);
        
        // 更新收藏按钮状态
        addToFavorites.textContent = isFavorited ? '已收藏' : '收藏';
        addToFavorites.disabled = isFavorited;
        if (isFavorited) {
          addToFavorites.classList.remove('btn-outline-primary');
          addToFavorites.classList.add('btn-secondary');
        } else {
          addToFavorites.classList.add('btn-outline-primary');
          addToFavorites.classList.remove('btn-secondary');
        }

        // 添加到常用直播间按钮事件
        addToFavorites.onclick = () => addFavorite({
          owner: userInfo
        }, roomId);
        
        // 检查直播状态
        if (roomInfo.status === 4 || roomInfo.status_str === '4') {
          // 未开播状态
          streamTitle.textContent = roomInfo.title || '暂无直播标题';
          streamLinks.innerHTML = ''; // 清空直播流地址
          
          // 添加未开播提示
          const offlineNotice = document.createElement('div');
          offlineNotice.className = 'alert alert-warning mt-3 mb-0';
          offlineNotice.textContent = '主播当前未开播';
          streamLinks.appendChild(offlineNotice);
          
          result.classList.remove('d-none');
          error.classList.add('d-none');
        } else if (roomInfo.status === 2 && roomInfo.status_str === '2') {
          // 直播中状态
          streamTitle.textContent = roomInfo.title;
          
          // 清空之前的链接
          streamLinks.innerHTML = '';
          
          const qualityMap = {
            'FULL_HD1': '蓝光',
            'HD1': '超清',
            'SD1': '高清',
            'SD2': '标清'
          };
          
          // 显示FLV直链
          const flvUrls = roomInfo.stream_url.flv_pull_url;
          for (const [quality, url] of Object.entries(flvUrls)) {
            streamLinks.appendChild(createStreamLinkElement(qualityMap[quality], url, 'FLV'));
          }
          
          // 显示HLS直链
          const hlsUrls = roomInfo.stream_url.hls_pull_url_map;
          for (const [quality, url] of Object.entries(hlsUrls)) {
            streamLinks.appendChild(createStreamLinkElement(qualityMap[quality], url, 'HLS'));
          }
          
          result.classList.remove('d-none');
          error.classList.add('d-none');
        } else {
          throw new Error('获取直播信息失败');
        }
      } catch (err) {
        console.error('解析错误:', err);
        result.classList.add('d-none');
        error.textContent = '解析失败：' + err.message;
        error.classList.remove('d-none');
      }
    }

    // 添加检测所有直播间状态的函数
    async function checkAllLiveStatus() {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      const result = await browserAPI.storage.local.get('favorites');
      const favorites = result.favorites || [];
      
      if (favorites.length === 0) {
        return;
      }

      // 显示加载状态
      const buttonText = checkAllStatus.querySelector('.check-status-text');
      const spinner = checkAllStatus.querySelector('.spinner-border');
      buttonText.textContent = '检测中...';
      spinner.classList.remove('d-none');
      checkAllStatus.disabled = true;

      try {
        // 获取所有直播间状态
        const statusResults = await Promise.all(favorites.map(async (favorite) => {
          try {
            const response = await fetch(`https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=120.0.0.0&web_rid=${favorite.roomId}`, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://live.douyin.com',
                'Referer': `https://live.douyin.com/${favorite.roomId}`
              }
            });
            const data = await response.json();
            return {
              roomId: favorite.roomId,
              status: data.data.data[0].status
            };
          } catch (err) {
            return {
              roomId: favorite.roomId,
              status: 'error'
            };
          }
        }));

        // 更新UI显示状态
        statusResults.forEach(result => {
          const statusBadge = document.querySelector(`[data-room-id="${result.roomId}"] .status-badge`);
          if (statusBadge) {
            if (result.status === 2) {
              statusBadge.textContent = '🟢';
              statusBadge.dataset.status = '直播中';  // 使用dataset存储状态文本
            } else if (result.status === 4) {
              statusBadge.textContent = '⚫';
              statusBadge.dataset.status = '未开播';
            } else {
              statusBadge.textContent = '🔴';
              statusBadge.dataset.status = '检测失败';
            }
            statusBadge.classList.remove('d-none');
          }
        });
      } catch (err) {
        console.error('检测状态失败:', err);
        showToast('检测状态失败');
      } finally {
        // 恢复按钮状态
        buttonText.textContent = '检测直播状态';
        spinner.classList.add('d-none');
        checkAllStatus.disabled = false;
      }
    }

    // 修改检测按钮的点击事件处理
    checkAllStatus.addEventListener('click', function(event) {
      checkAllLiveStatus();
    });

    // 初始化加载常用直播间
    loadFavorites();

    // 修改检查当前页面的逻辑
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    browserAPI.tabs.query({active: true, currentWindow: true}).then(async tabs => {
      const currentUrl = tabs[0].url;
      
      // 检查是否是用户主页
      if (currentUrl.includes('douyin.com/user/')) {
        try {
          const response = await browserAPI.tabs.sendMessage(tabs[0].id, {
            action: 'getPageSource'
          });
          
          const liveMatch = response.source.match(/https:\/\/live\.douyin\.com\/(\d+)/);
          if (liveMatch) {
            const roomId = liveMatch[1];
            // 直接使用完整URL
            roomInput.value = `https://live.douyin.com/${roomId}`;
            parseRoom(roomId);
          } else {
            error.textContent = '当前用户未在直播';
            error.classList.remove('d-none');
            result.classList.add('d-none');
          }
        } catch (err) {
          console.error('获取页面源代码失败:', err);
          error.textContent = '检测直播状态失败';
          error.classList.remove('d-none');
          result.classList.add('d-none');
        }
      } else {
        // 原有的直播间检测逻辑
        const roomId = extractRoomId(currentUrl);
        if (roomId) {
          // 使用完整URL
          roomInput.value = `https://live.douyin.com/${roomId}`;
          parseRoom(roomId);
        }
      }
    }).catch(err => {
      console.error('获取当前标签页失败:', err);
    });
  } catch (err) {
    console.error('初始化失败:', err);
  }
});