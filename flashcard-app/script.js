// ========================================
// FlashCard Pro - 完整功能版
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  
  // ========================================
  // 全局状态管理
  // ========================================
  const state = {
    currentFilter: 'All',
    searchQuery: '',
    sortBy: 'default',
    viewMode: 'grid',
    favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
    learnedCards: new Set(JSON.parse(localStorage.getItem('learned') || '[]')),
    studyTime: parseInt(localStorage.getItem('studyTime') || '0'),
    isDarkTheme: localStorage.getItem('darkTheme') === 'true'
  };

  // ========================================
  // DOM 元素引用
  // ========================================
  const elements = {
    cardContainer: document.getElementById('card-container'),
    categoryFilters: document.getElementById('category-filters'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    sortSelect: document.getElementById('sort-select'),
    viewBtns: document.querySelectorAll('.view-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    statsBtn: document.getElementById('stats-btn'),
    statsPanel: document.getElementById('stats-panel'),
    closeStats: document.getElementById('close-stats'),
    addCardBtn: document.getElementById('add-card-btn'),
    addCardModal: document.getElementById('add-card-modal'),
    closeAddModal: document.getElementById('close-add-modal'),
    cancelAdd: document.getElementById('cancel-add'),
    addCardForm: document.getElementById('add-card-form'),
    quizBtn: document.getElementById('quiz-btn'),
    quizModal: document.getElementById('quiz-modal'),
    closeQuiz: document.getElementById('close-quiz'),
    emptyState: document.getElementById('empty-state'),
    audioIndicator: document.getElementById('audio-indicator'),
    toast: document.getElementById('toast')
  };

  let currentAudio = null;
  let studyInterval = null;

  // ========================================
  // 初始化
  // ========================================
  function init() {
    // 应用深色主题
    if (state.isDarkTheme) {
      document.body.classList.add('dark-theme');
      elements.themeToggle.querySelector('i').className = 'fas fa-sun';
    }

    // 创建过滤器和渲染卡片
    createCategoryFilters();
    renderCards();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新统计数据
    updateStats();
    
    // 启动学习时间追踪
    startStudyTimer();
  }

  // ========================================
  // 事件监听器设置
  // ========================================
  function setupEventListeners() {
    // 搜索功能
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearSearch.addEventListener('click', clearSearch);

    // 排序功能
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderCards();
    });

    // 视图切换
    elements.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.dataset.view;
        
        if (state.viewMode === 'list') {
          elements.cardContainer.classList.add('list-view');
        } else {
          elements.cardContainer.classList.remove('list-view');
        }
      });
    });

    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);

    // 统计面板
    elements.statsBtn.addEventListener('click', () => {
      elements.statsPanel.classList.add('active');
      updateStats();
    });
    elements.closeStats.addEventListener('click', () => {
      elements.statsPanel.classList.remove('active');
    });

    // 添加卡片模态框
    elements.addCardBtn.addEventListener('click', () => {
      elements.addCardModal.classList.add('active');
    });
    elements.closeAddModal.addEventListener('click', closeAddCardModal);
    elements.cancelAdd.addEventListener('click', closeAddCardModal);
    elements.addCardForm.addEventListener('submit', handleAddCard);

    // 测验模式
    elements.quizBtn.addEventListener('click', startQuiz);
    elements.closeQuiz.addEventListener('click', () => {
      elements.quizModal.classList.remove('active');
    });

    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboard);

    // 点击模态框背景关闭
    [elements.addCardModal, elements.quizModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  }

  // ========================================
  // 分类过滤器创建
  // ========================================
  function createCategoryFilters() {
    const categories = ['All', ...new Set(cardData.map(card => card.category))];
    
    elements.categoryFilters.innerHTML = '';
    
    categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.textContent = category;
      button.dataset.category = category;
      
      if (category === state.currentFilter) {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        state.currentFilter = category;
        renderCards();
      });
      
      elements.categoryFilters.appendChild(button);
    });
  }

  // ========================================
  // 卡片渲染
  // ========================================
  function renderCards() {
    let filteredData = getFilteredCards();
    
    elements.cardContainer.innerHTML = '';
    
    if (filteredData.length === 0) {
      elements.emptyState.style.display = 'block';
      return;
    }
    
    elements.emptyState.style.display = 'none';
    
    filteredData.forEach((card, index) => {
      const cardElement = createCardElement(card, index);
      elements.cardContainer.appendChild(cardElement);
    });
  }

  // ========================================
  // 获取过滤后的卡片
  // ========================================
  function getFilteredCards() {
    let filtered = [...cardData];
    
    // 分类过滤
    if (state.currentFilter !== 'All') {
      filtered = filtered.filter(card => card.category === state.currentFilter);
    }
    
    // 搜索过滤
    if (state.searchQuery) {
      filtered = filtered.filter(card => 
        card.word.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (card.translation && card.translation.toLowerCase().includes(state.searchQuery.toLowerCase()))
      );
    }
    
    // 排序
    filtered = sortCards(filtered);
    
    return filtered;
  }

  // ========================================
  // 卡片排序
  // ========================================
  function sortCards(cards) {
    switch (state.sortBy) {
      case 'alphabetical':
        return cards.sort((a, b) => a.word.localeCompare(b.word));
      case 'recent':
        return cards.sort((a, b) => b.id - a.id);
      case 'favorites':
        return cards.sort((a, b) => {
          const aFav = state.favorites.has(a.id);
          const bFav = state.favorites.has(b.id);
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          return 0;
        });
      default:
        return cards;
    }
  }

  // ========================================
  // 创建卡片元素
  // ========================================
  function createCardElement(card, index) {
    const cardElement = document.createElement('div');
    cardElement.className = 'flashcard';
    cardElement.style.setProperty('--i', index);
    
    const isFavorite = state.favorites.has(card.id);
    const isLearned = state.learnedCards.has(card.id);
    
    cardElement.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          ${isLearned ? '<div class="card-status"><i class="fas fa-check"></i> 已掌握</div>' : ''}
          <div class="card-image-container">
            <img src="${card.image}" alt="${card.word}">
            <div class="card-actions">
              <button class="card-action-btn favorite ${isFavorite ? 'active' : ''}" data-id="${card.id}">
                <i class="fas fa-heart"></i>
              </button>
              <button class="card-action-btn audio" data-audio="${card.audio}">
                <i class="fas fa-volume-up"></i>
              </button>
              <button class="card-action-btn flip">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          <div class="card-content">
            <div class="card-word">${card.word}</div>
            ${card.translation ? `<div class="card-translation">${card.translation}</div>` : ''}
            <span class="card-category">${card.category}</span>
          </div>
        </div>
        <div class="card-back">
          <div class="card-back-word">${card.word}</div>
          <div class="card-back-translation">${card.translation || '暂无翻译'}</div>
          <div class="card-back-actions">
            <button class="card-back-btn" data-id="${card.id}" data-action="learned">
              <i class="fas fa-check"></i> ${isLearned ? '取消掌握' : '已掌握'}
            </button>
            <button class="card-back-btn" data-audio="${card.audio}">
              <i class="fas fa-volume-up"></i> 发音
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 添加事件监听
    setupCardEvents(cardElement, card);
    
    return cardElement;
  }

  // ========================================
  // 设置卡片事件
  // ========================================
  function setupCardEvents(cardElement, card) {
    // 收藏按钮
    const favoriteBtn = cardElement.querySelector('.card-action-btn.favorite');
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(card.id);
      favoriteBtn.classList.toggle('active');
      updateStats();
      showToast(state.favorites.has(card.id) ? '已添加到收藏' : '已取消收藏', 'success');
    });

    // 音频播放按钮
    cardElement.querySelectorAll('[data-audio]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(card.audio);
      });
    });

    // 翻转按钮
    const flipBtn = cardElement.querySelector('.card-action-btn.flip');
    flipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cardElement.classList.toggle('flipped');
    });

    // 已掌握按钮
    const learnedBtn = cardElement.querySelector('[data-action="learned"]');
    learnedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLearned(card.id);
      renderCards();
      updateStats();
      showToast(state.learnedCards.has(card.id) ? '标记为已掌握' : '取消已掌握', 'success');
    });

    // 卡片点击翻转
    cardElement.addEventListener('click', () => {
      cardElement.classList.toggle('flipped');
    });
  }

  // ========================================
  // 收藏功能
  // ========================================
  function toggleFavorite(cardId) {
    if (state.favorites.has(cardId)) {
      state.favorites.delete(cardId);
    } else {
      state.favorites.add(cardId);
    }
    saveFavorites();
  }

  function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
  }

  // ========================================
  // 学习进度功能
  // ========================================
  function toggleLearned(cardId) {
    if (state.learnedCards.has(cardId)) {
      state.learnedCards.delete(cardId);
    } else {
      state.learnedCards.add(cardId);
    }
    saveLearned();
  }

  function saveLearned() {
    localStorage.setItem('learned', JSON.stringify([...state.learnedCards]));
  }

  // ========================================
  // 音频播放
  // ========================================
  function playAudio(audioSrc) {
    if (!audioSrc) {
      showToast('该单词暂无音频', 'error');
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    currentAudio = new Audio(audioSrc);
    
    elements.audioIndicator.classList.add('active');
    
    currentAudio.play()
      .then(() => {
        currentAudio.onended = () => {
          elements.audioIndicator.classList.remove('active');
        };
      })
      .catch(error => {
        console.error("音频播放失败:", error);
        elements.audioIndicator.classList.remove('active');
        showToast('音频播放失败', 'error');
      });
  }

  // ========================================
  // 搜索功能
  // ========================================
  function handleSearch(e) {
    state.searchQuery = e.target.value;
    renderCards();
  }

  function clearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    renderCards();
  }

  // ========================================
  // 主题切换
  // ========================================
  function toggleTheme() {
    state.isDarkTheme = !state.isDarkTheme;
    document.body.classList.toggle('dark-theme');
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = state.isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
    
    localStorage.setItem('darkTheme', state.isDarkTheme);
    showToast(`已切换到${state.isDarkTheme ? '深色' : '浅色'}模式`, 'success');
  }

  // ========================================
  // 统计更新
  // ========================================
  function updateStats() {
    document.getElementById('total-cards').textContent = cardData.length;
    document.getElementById('favorite-cards').textContent = state.favorites.size;
    document.getElementById('learned-cards').textContent = state.learnedCards.size;
    document.getElementById('study-time').textContent = state.studyTime;
    
    const progress = cardData.length > 0 ? (state.learnedCards.size / cardData.length * 100).toFixed(1) : 0;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `已掌握 ${progress}%`;
  }

  // ========================================
  // 学习时间追踪
  // ========================================
  function startStudyTimer() {
    studyInterval = setInterval(() => {
      state.studyTime++;
      localStorage.setItem('studyTime', state.studyTime);
      if (elements.statsPanel.classList.contains('active')) {
        updateStats();
      }
    }, 60000); // 每分钟更新一次
  }

  // ========================================
  // 添加卡片
  // ========================================
  function handleAddCard(e) {
    e.preventDefault();
    
    const newCard = {
      id: cardData.length + 1,
      word: document.getElementById('new-word').value,
      category: document.getElementById('new-category').value,
      image: document.getElementById('new-image').value,
      audio: document.getElementById('new-audio').value || '',
      translation: document.getElementById('new-translation').value || ''
    };
    
    cardData.push(newCard);
    
    // 保存到本地存储
    localStorage.setItem('customCards', JSON.stringify(cardData));
    
    closeAddCardModal();
    createCategoryFilters();
    renderCards();
    updateStats();
    
    showToast('卡片添加成功！', 'success');
  }

  function closeAddCardModal() {
    elements.addCardModal.classList.remove('active');
    elements.addCardForm.reset();
  }

  // ========================================
  // 测验模式
  // ========================================
  let quizData = [];
  let currentQuizIndex = 0;
  let quizScore = 0;

  function startQuiz() {
    if (cardData.length < 4) {
      showToast('至少需要4张卡片才能开始测验', 'error');
      return;
    }

    // 随机选择10张卡片
    quizData = shuffleArray([...cardData]).slice(0, Math.min(10, cardData.length));
    currentQuizIndex = 0;
    quizScore = 0;
    
    elements.quizModal.classList.add('active');
    document.getElementById('quiz-content').style.display = 'block';
    document.getElementById('quiz-score').style.display = 'none';
    
    showQuizQuestion();
  }

  function showQuizQuestion() {
    const card = quizData[currentQuizIndex];
    
    document.getElementById('quiz-current').textContent = currentQuizIndex + 1;
    document.getElementById('quiz-total').textContent = quizData.length;
    document.getElementById('quiz-image').src = card.image;
    
    // 生成选项（1个正确答案 + 3个错误答案）
    const options = [card.word];
    const otherCards = cardData.filter(c => c.id !== card.id);
    
    while (options.length < 4 && otherCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherCards.length);
      const randomCard = otherCards.splice(randomIndex, 1)[0];
      if (!options.includes(randomCard.word)) {
        options.push(randomCard.word);
      }
    }
    
    shuffleArray(options);
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    
    options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = option;
      btn.addEventListener('click', () => checkAnswer(option, card.word, btn));
      optionsContainer.appendChild(btn);
    });
    
    document.getElementById('quiz-result').innerHTML = '';
  }

  function checkAnswer(selected, correct, btn) {
    const allOptions = document.querySelectorAll('.quiz-option');
    allOptions.forEach(opt => opt.classList.add('disabled'));
    
    if (selected === correct) {
      btn.classList.add('correct');
      quizScore++;
      document.getElementById('quiz-result').innerHTML = '<div style="color: var(--success-color);">✓ 正确！</div>';
    } else {
      btn.classList.add('incorrect');
      allOptions.forEach(opt => {
        if (opt.textContent === correct) {
          opt.classList.add('correct');
        }
      });
      document.getElementById('quiz-result').innerHTML = `<div style="color: var(--error-color);">✗ 错误，正确答案是: ${correct}</div>`;
    }
    
    setTimeout(() => {
      currentQuizIndex++;
      if (currentQuizIndex < quizData.length) {
        showQuizQuestion();
      } else {
        showQuizResult();
      }
    }, 1500);
  }

  function showQuizResult() {
    document.getElementById('quiz-content').style.display = 'none';
    document.getElementById('quiz-score').style.display = 'block';
    document.getElementById('final-score').textContent = quizScore;
    
    const percentage = (quizScore / quizData.length * 100).toFixed(0);
    let message = '';
    
    if (percentage >= 80) {
      message = '太棒了！🎉';
    } else if (percentage >= 60) {
      message = '不错哦！👍';
    } else {
      message = '继续加油！💪';
    }
    
    showToast(`${message} 得分: ${quizScore}/${quizData.length}`, 'success');
  }

  document.getElementById('restart-quiz')?.addEventListener('click', startQuiz);

  // ========================================
  // 键盘快捷键
  // ========================================
  function handleKeyboard(e) {
    // Ctrl/Cmd + K: 搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      elements.searchInput.focus();
    }
    
    // Ctrl/Cmd + D: 深色模式
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      toggleTheme();
    }
    
    // Escape: 关闭模态框
    if (e.key === 'Escape') {
      elements.statsPanel.classList.remove('active');
      elements.addCardModal.classList.remove('active');
      elements.quizModal.classList.remove('active');
    }
  }

  // ========================================
  // Toast 通知
  // ========================================
  let toastTimeout;
  
  function showToast(message, type = 'info') {
    clearTimeout(toastTimeout);
    
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('active');
    
    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove('active');
    }, 3000);
  }

  // ========================================
  // 工具函数
  // ========================================
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ========================================
  // 启动应用
  // ========================================
  init();

  // 页面卸载时保存数据
  window.addEventListener('beforeunload', () => {
    saveFavorites();
    saveLearned();
    localStorage.setItem('studyTime', state.studyTime);
  });

});