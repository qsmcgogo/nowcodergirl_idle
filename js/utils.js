/**
 * 牛客娘挂机游戏 - 工具函数
 */

const Utils = {
  /**
   * 保留小数位数
   * @param {number} num
   * @param {number} decimal
   * @returns {number}
   */
  round(num, decimal = 2) {
    const pow = Math.pow(10, decimal);
    return Math.floor(num * pow) / pow;
  },

  /**
   * 格式化大数字显示（如 1.2k, 3.5M），支持浮点
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    if (num < 1000) return num % 1 ? num.toFixed(1) : String(num);
    if (num < 1e6) return (num / 1000).toFixed(1) + 'k';
    if (num < 1e9) return (num / 1e6).toFixed(1) + 'M';
    return (num / 1e9).toFixed(1) + 'B';
  },

  /**
   * 格式化攻血等战斗数值（浮点，支持大数）
   * @param {number} num
   * @returns {string}
   */
  formatCombatNum(num) {
    if (num < 1000) return num % 1 ? num.toFixed(1) : String(num);
    return this.formatNumber(num);
  }
};
