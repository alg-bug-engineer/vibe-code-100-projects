// 等待整个 HTML 页面加载完成后再执行脚本
document.addEventListener('DOMContentLoaded', () => {

  // --- 1. 获取 HTML 元素 ---
  const cardContainer = document.getElementById('card-container');
  const categoryFilters = document.getElementById('category-filters');
  
  // 用于跟踪当前正在播放的音频，防止重叠播放
  let currentAudio = null;
  // 用于跟踪当前激活的按钮
  let currentActiveButton = null;

  // --- 2. 动态创建分类过滤器按钮 ---
  function createCategoryFilters() {
    // 从 cardData 中提取所有唯一的 category
    const categories = ['All', ...new Set(cardData.map(card => card.category))];
    
    categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.textContent = category;
      button.dataset.category = category; // 使用 data-* 属性存储类别名
      
      // 默认 "All" 按钮为激活状态
      if (category === 'All') {
        button.classList.add('active');
        currentActiveButton = button;
      }
      
      // 为按钮添加点击事件
      button.addEventListener('click', () => {
        // 移除上一个按钮的激活状态
        if (currentActiveButton) {
          currentActiveButton.classList.remove('active');
        }
        // 设置当前按钮为激活状态
        button.classList.add('active');
        currentActiveButton = button;
        
        // 渲染对应分类的卡片
        renderCards(category);
      });
      
      categoryFilters.appendChild(button);
    });
  }

  // --- 3. 渲染卡片到页面 ---
  function renderCards(filter = 'All') {
    // 清空
    cardContainer.innerHTML = ''; 

    // 过滤数据
    const filteredData = (filter === 'All')
      ? cardData // 如果是 'All'，显示所有数据
      : cardData.filter(card => card.category === filter); // 否则，只显示匹配分类的数据

    // 遍历过滤后的数据，创建卡片
    filteredData.forEach(card => {
      // 创建卡片 div
      const cardElement = document.createElement('div');
      cardElement.className = 'flashcard';
      
      // 关键：将音频路径存储在 data-* 属性中
      cardElement.dataset.audio = card.audio; 
      
      // 创建图片
      const img = document.createElement('img');
      img.src = card.image;
      img.alt = card.word;
      
      cardElement.appendChild(img);
      
      // (可选) 如果你的图片上没有单词，可以在这里添加单词文本
      // const wordText = document.createElement('div');
      // wordText.className = 'word';
      // wordText.textContent = card.word;
      // cardElement.appendChild(wordText);
      
      // 添加点击事件来播放音频
      cardElement.addEventListener('click', () => {
        playAudio(card.audio);
      });

      // 将卡片添加到容器中
      cardContainer.appendChild(cardElement);
    });
  }

  // --- 4. 播放音频的函数 ---
  function playAudio(audioSrc) {
    // 如果有音频正在播放，先停止并重置
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // 创建新的音频对象
    const audio = new Audio(audioSrc);
    currentAudio = audio; // 跟踪这个新音频
    
    // 播放
    audio.play().catch(error => {
      // 某些浏览器可能禁止自动播放，这里处理错误
      console.error("音频播放失败:", error);
    });
  }

  // --- 5. 初始化应用 ---
  function init() {
    createCategoryFilters(); // 创建过滤器按钮
    renderCards('All');      // 默认渲染所有卡片
  }
  
  init(); // 运行！

});