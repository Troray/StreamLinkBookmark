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

    // 新增变量
    const backButton = document.querySelector('.back-button');
    const settingsButton = document.querySelector('.settings-button');
    const settingsContainer = document.querySelector('.settings-container');
    const mainContent = document.querySelector('.main-content');
    const playerOptions = document.querySelectorAll('.player-option');
    const customProtocolInput = document.getElementById('customProtocol');
    const saveProtocolBtn = document.getElementById('saveProtocol');
    
    // 播放器配置
    const defaultPlayers = {
      potplayer: {
        protocol: 'potplayer://',
        icon: 'image/potplayer.webp'
      },
      vlc: {
        protocol: 'vlc://',
        icon: 'image/vlc.webp'
      },
      iina: {
        protocol: 'iina://weblink?url=',
        icon: 'image/iina.webp'
      },
      custom: {
        protocol: '',
        icon: 'image/video.png'
      }
    };
    
    // 添加到popup.js开头部分，作为全局变量
    let activeTooltip = null;
    let tooltipTimeout = null;

    // 修改showTooltip函数，支持跟随鼠标位置
    function showTooltip(target, text, event = null, followMouse = false) {
      // 清除已存在的tooltip和超时
      hideTooltip();
      
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      tooltip.textContent = text;
      
      // 如果提供了鼠标事件，使用鼠标位置
      if (event && followMouse) {
        tooltip.style.top = `${event.clientY + 15}px`;
        tooltip.style.left = `${event.clientX}px`;
        // 给tooltip添加数据属性，标记为跟随鼠标
        tooltip.dataset.followMouse = 'true';
      } else {
        // 否则使用目标元素位置
        const rect = target.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
        tooltip.style.transform = 'translateX(-50%)';
      }
      
      document.body.appendChild(tooltip);
      
      // 强制重绘并显示
      tooltip.offsetHeight;
      tooltip.style.opacity = '1';
      
      // 保存当前tooltip引用
      activeTooltip = tooltip;
      
      return tooltip;
    }

    // 添加一个新的moveTooltip函数，用于跟随鼠标移动
    function moveTooltip(event) {
      if (activeTooltip && activeTooltip.dataset.followMouse === 'true') {
        activeTooltip.style.top = `${event.clientY + 15}px`;
        activeTooltip.style.left = `${event.clientX}px`;
      }
    }

    // 隐藏tooltip的通用函数
    function hideTooltip() {
      // 清除任何现有的超时
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      
      // 如果有活动的tooltip，移除它
      if (activeTooltip) {
        activeTooltip.style.opacity = '0';
        const tooltipToRemove = activeTooltip;
        tooltipTimeout = setTimeout(() => {
          if (tooltipToRemove && tooltipToRemove.parentNode) {
            tooltipToRemove.parentNode.removeChild(tooltipToRemove);
          }
        }, 300); // 300ms的过渡时间
        activeTooltip = null;
      }
      
      // 移除所有可能残留的tooltip
      document.querySelectorAll('.custom-tooltip').forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 300);
      });
    }

    // 加载设置
    async function loadSettings() {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      const result = await browserAPI.storage.local.get(['selectedPlayer', 'customProtocol']);
      
      // 设置默认选中的播放器
      const selectedPlayer = result.selectedPlayer || 'potplayer';
      playerOptions.forEach(option => {
        if (option.dataset.player === selectedPlayer) {
          option.classList.add('selected');
        }
      });
      
      // 设置自定义协议
      if (result.customProtocol) {
        customProtocolInput.value = result.customProtocol;
      }
    }
    
    // 保存设置
    async function saveSettings(player, protocol) {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      
      // 如果选择了预置播放器且没有自定义协议，清除customProtocol
      if (player && !protocol) {
        await browserAPI.storage.local.set({
          selectedPlayer: player,
          customProtocol: ''  // 清除自定义协议
        });
        
        // 更新所有播放器图标为选中的预置播放器图标
        document.querySelectorAll('.player-icon').forEach(icon => {
          icon.src = defaultPlayers[player].icon;
        });
      } else {
        // 保存自定义协议设置
        await browserAPI.storage.local.set({
          selectedPlayer: player,
          customProtocol: protocol
        });
        
        // 如果有自定义协议，更新所有图标为通用图标
        if (protocol) {
          document.querySelectorAll('.player-icon').forEach(icon => {
            icon.src = defaultPlayers.custom.icon;
          });
        }
      }
      
      showToast('设置已保存');
    }

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
              showTooltip(e.target, statusBadge.dataset.status || '未检测');
            });

            statusBadge.addEventListener('mouseleave', () => {
              hideTooltip();
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

    // 修改showToast函数
    function showToast(message, isError = false) {
      const toast = document.createElement('div');
      toast.className = 'copy-toast';
      if (isError) {
        toast.style.backgroundColor = 'rgba(220, 53, 69, 0.9)'; // 错误提示使用红色背景
      }
      toast.textContent = message;
      document.body.appendChild(toast);
      
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
      
      // 错误提示显示时间更长 (5秒)，普通提示仍为2秒
      const displayTime = isError ? 5000 : 2000;
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, displayTime);
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

    // 添加检查协议是否可用的函数
    async function checkProtocolSupport(protocol) {
      return new Promise((resolve) => {
        // 创建一个隐藏的iframe来测试协议
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // 设置超时检测
        const timeoutId = setTimeout(() => {
          document.body.removeChild(iframe);
          resolve(false);
        }, 100);
        
        // 监听iframe的加载事件
        iframe.onload = () => {
          clearTimeout(timeoutId);
          document.body.removeChild(iframe);
          resolve(true);
        };
        
        // 尝试加载协议
        try {
          iframe.src = protocol + 'about:blank';
        } catch(e) {
          clearTimeout(timeoutId);
          document.body.removeChild(iframe);
          resolve(false);
        }
      });
    }

    // 修改createStreamLinkElement函数
    function createStreamLinkElement(quality, url, type) {
      const item = document.createElement('div');
      item.className = 'list-group-item stream-link d-flex align-items-center py-2';
      
      // 创建一个简短的清晰度标识
      let shortQuality = '';
      switch(quality) {
        case '蓝光': shortQuality = '蓝'; break;
        case '超清': shortQuality = '超'; break;
        case '高清': shortQuality = '高'; break;
        case '标清': shortQuality = '标'; break;
        default: shortQuality = quality.charAt(0);
      }
      
      // 类型标签容器
      const typeLabelContainer = document.createElement('div');
      typeLabelContainer.className = 'type-label';
      
      // 为类型标签添加tooltip
      typeLabelContainer.addEventListener('mouseenter', () => {
        showTooltip(typeLabelContainer, quality);
      });

      typeLabelContainer.addEventListener('mouseleave', () => {
        hideTooltip();
      });
      
      // 类型标签 - 使用自定义背景色
      const typeLabel = document.createElement('span');
      typeLabel.className = 'badge me-2';
      typeLabel.textContent = type;
      
      // 为FLV和HLS设置自定义背景色
      if (type === 'FLV') {
        typeLabel.style.backgroundColor = 'rgb(50, 112, 122)';
      } else {
        typeLabel.style.backgroundColor = 'rgb(25, 170, 194)';
      }
      typeLabel.style.color = 'white';
      
      // 创建角标
      const badge = document.createElement('span');
      badge.className = 'quality-badge';
      badge.textContent = shortQuality;
      
      // URL显示
      const urlSpan = document.createElement('span');
      urlSpan.className = 'flex-grow-1 ms-2';
      urlSpan.textContent = url;
      urlSpan.style.cursor = 'pointer';
      
      // 为URL添加自定义tooltip，跟随鼠标
      urlSpan.addEventListener('mouseenter', (e) => {
        showTooltip(urlSpan, '点击复制', e, true);
      });
      
      // 添加鼠标移动事件
      urlSpan.addEventListener('mousemove', (e) => {
        moveTooltip(e);
      });
      
      urlSpan.addEventListener('mouseleave', () => {
        hideTooltip();
      });
      
      // 点击链接复制
      urlSpan.onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
          showToast('已复制到剪贴板');
        });
      };
      
      // 播放器图标
      const playerIcon = document.createElement('img');
      playerIcon.className = 'player-icon ms-2';
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      browserAPI.storage.local.get(['selectedPlayer', 'customProtocol']).then(result => {
        const player = result.selectedPlayer || 'potplayer';
        if (result.customProtocol) {
          playerIcon.src = defaultPlayers.custom.icon;
        } else {
          playerIcon.src = defaultPlayers[player].icon;
        }
      });
      
      // 为播放器图标添加自定义tooltip
      playerIcon.addEventListener('mouseenter', () => {
        showTooltip(playerIcon, '播放');
      });
      
      playerIcon.addEventListener('mouseleave', () => {
        hideTooltip();
      });
      
      // 点击图标调用播放器
      playerIcon.onclick = async (event) => {
        event.preventDefault(); // 阻止默认行为
        
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        const result = await browserAPI.storage.local.get(['selectedPlayer', 'customProtocol']);
        const protocol = result.customProtocol || defaultPlayers[result.selectedPlayer || 'potplayer'].protocol;
        
        // 创建一个安全的方式来尝试启动协议
        const protocolFrame = document.createElement('iframe');
        protocolFrame.style.display = 'none';
        document.body.appendChild(protocolFrame);
        
        // 设置超时检测
        let handleFrameError = null;
        const protocolTimeoutId = setTimeout(() => {
          // 如果超时，说明协议可能不被支持
          cleanupProtocolCheck();
          showToast(`播放器未安装或不支持此协议，请检查设置`, true);
        }, 1000);
        
        // 处理错误
        const handleError = () => {
          cleanupProtocolCheck();
          showToast(`播放器未安装或不支持此协议，请检查设置`, true);
        };
        
        // 处理成功
        const handleSuccess = () => {
          cleanupProtocolCheck();
          showToast('已发送到播放器');
        };
        
        // 清理函数
        const cleanupProtocolCheck = () => {
          clearTimeout(protocolTimeoutId);
          window.removeEventListener('blur', handleBlur);
          if (protocolFrame.parentNode) {
            document.body.removeChild(protocolFrame);
          }
        };
        
        // 如果窗口失去焦点，可能意味着协议处理程序已启动
        const handleBlur = () => {
          setTimeout(() => {
            cleanupProtocolCheck();
          }, 500);
        };
        
        // 监听窗口焦点变化
        window.addEventListener('blur', handleBlur);
        
        try {
          // 设置焦点监听来检测协议是否被处理
          showToast('正在尝试启动播放器...');
          
          // 使用iframe安全地尝试启动协议
          protocolFrame.src = protocol + url;
          
          // 如果到这里没有出错或窗口没有失焦，在短暂延迟后检查
          setTimeout(() => {
            if (document.hasFocus()) {
              // 如果窗口仍有焦点，可能协议没被处理
              handleError();
            }
          }, 500);
        } catch (e) {
          handleError();
        }
      };
      
      // 将元素添加到列表项
      typeLabelContainer.appendChild(typeLabel);
      typeLabelContainer.appendChild(badge);
      
      item.appendChild(typeLabelContainer);
      item.appendChild(urlSpan);
      item.appendChild(playerIcon);
      
      return item;
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

    // 设置按钮点击事件
    settingsButton.addEventListener('click', () => {
      mainContent.style.display = 'none';
      settingsContainer.style.display = 'block';
      backButton.style.display = 'block';
      loadSettings();
    });
    
    // 返回按钮点击事件
    backButton.addEventListener('click', () => {
      settingsContainer.style.display = 'none';
      mainContent.style.display = 'block';
      backButton.style.display = 'none';
    });
    
    // 播放器选择事件
    playerOptions.forEach(option => {
      option.addEventListener('click', () => {
        // 移除所有选中状态
        playerOptions.forEach(opt => opt.classList.remove('selected'));
        // 添加新的选中状态
        option.classList.add('selected');
        
        // 清除自定义协议输入框的值
        customProtocolInput.value = '';
        
        // 保存设置（不包含自定义协议）
        saveSettings(option.dataset.player, '');
        
        // 更新所有播放器图标为选中的预置播放器图标
        document.querySelectorAll('.player-icon').forEach(icon => {
          icon.src = defaultPlayers[option.dataset.player].icon;
        });
      });
    });
    
    // 保存自定义协议按钮点击事件
    saveProtocolBtn.addEventListener('click', () => {
      const selectedPlayer = document.querySelector('.player-option.selected');
      const protocol = customProtocolInput.value.trim();
      
      if (selectedPlayer && protocol) {
        saveSettings(selectedPlayer.dataset.player, protocol);
      } else if (!protocol) {
        showToast('请输入自定义协议');
      }
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

    // 添加全局事件监听器，确保tooltip能被清理
    document.addEventListener('mousemove', (e) => {
      // 如果鼠标移动过快，确保所有tooltip的mouseleave事件能被正确处理
      const tooltips = document.querySelectorAll('.custom-tooltip');
      const isOverTooltip = Array.from(tooltips).some(tooltip => 
        tooltip.contains(e.target) || e.target.contains(tooltip));
      
      if (!isOverTooltip && tooltips.length > 0) {
        setTimeout(() => {
          // 检查2秒后是否还有tooltip，如果有则清理
          document.querySelectorAll('.custom-tooltip').forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 200);
          });
        }, 2000);
      }
    });
  } catch (err) {
    console.error('初始化失败:', err);
  }
});