/**
 * 牛客娘挂机游戏 - 存档系统
 * Base64 编码/解码，支持浏览器缓存与导出/导入
 */

const Save = {
  /** localStorage 键名 */
  CACHE_KEY: 'nowcoder_girl_save',

  /**
   * 获取完整存档数据（供编码用）
   */
  getSaveData() {
    return {
      resources: Resources.getSnapshot(),
      attributes: Attributes.getSnapshot(),
      campaign: Campaign.getSnapshot(),
      skilltree: SkillTree.getSnapshot(),
      exam: Exam.getSnapshot(),
      battle: Battle.getSnapshot(),
      lastUpdateTime: Game.lastUpdateTime,
      version: 6
    };
  },

  /**
   * 应用存档数据到游戏
   */
  applySaveData(data) {
    if (!data || !data.resources) return false;
    Resources.loadSnapshot(data.resources);
    if (data.attributes) Attributes.loadSnapshot(data.attributes);
    if (data.campaign) Campaign.loadSnapshot(data.campaign);
    else if (data.version < 6) Campaign.loadSnapshot(null);
    if (data.skilltree) SkillTree.loadSnapshot(data.skilltree);
    else if (data.version < 5) SkillTree.loadSnapshot(null);
    if (!Resources.skilltreeEverUnlocked && data.skilltree &&
        ((data.skilltree.grammarLevel ?? 0) > 0 || (data.skilltree.mathLevel ?? 0) > 0)) {
      Resources.skilltreeEverUnlocked = true;
    }
    if (data.exam) Exam.loadSnapshot(data.exam);
    if (data.battle) Battle.loadSnapshot(data.battle);
    else if (data.version < 4) Battle.loadSnapshot(null);
    if (data.lastUpdateTime) Game.lastUpdateTime = data.lastUpdateTime;
    return true;
  },

  /**
   * 将数据编码为 Base64 字符串
   */
  encodeToBase64(data) {
    const json = JSON.stringify(data);
    try {
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
      console.warn('Base64 编码失败:', e);
      return null;
    }
  },

  /**
   * 将 Base64 字符串解码为数据
   */
  decodeFromBase64(str) {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed) return null;
    try {
      const json = decodeURIComponent(escape(atob(trimmed)));
      return JSON.parse(json);
    } catch (e) {
      console.warn('Base64 解码失败:', e);
      return null;
    }
  },

  /**
   * 保存到浏览器缓存（localStorage）
   */
  saveToCache() {
    try {
      const data = this.getSaveData();
      const encoded = this.encodeToBase64(data);
      if (encoded) {
        localStorage.setItem(this.CACHE_KEY, encoded);
        return true;
      }
    } catch (e) {
      console.warn('缓存存档失败:', e);
    }
    return false;
  },

  /**
   * 从浏览器缓存读取
   */
  loadFromCache() {
    try {
      const encoded = localStorage.getItem(this.CACHE_KEY);
      if (!encoded) return null;
      const data = this.decodeFromBase64(encoded);
      return data;
    } catch (e) {
      console.warn('缓存读档失败:', e);
      return null;
    }
  },

  /**
   * 导出为 Base64 字符串（供复制到剪贴板）
   */
  exportToBase64() {
    const data = this.getSaveData();
    return this.encodeToBase64(data);
  },

  /**
   * 从 Base64 字符串导入
   */
  importFromBase64(base64Str) {
    const data = this.decodeFromBase64(base64Str);
    if (!data) return false;
    return this.applySaveData(data);
  }
};
