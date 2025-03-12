/**
 * 日付関連のユーティリティクラス
 */
class DateUtils {
    /**
     * 日付文字列をフォーマットする
     * @param {string} dateString - 日付文字列
     * @returns {string} フォーマットされた日付文字列
     */
    static formatDate(dateString) {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return dateString; // 日付形式でない場合はそのまま返す
        }

        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * 指定された期間の開始日を取得
     * @param {string} period - 期間（'week', 'month', 'year'）
     * @returns {Date} 期間の開始日
     */
    static getPeriodStartDate(period) {
        const now = new Date();

        switch (period) {
            case 'week':
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return weekAgo;
            case 'month':
                const monthAgo = new Date();
                monthAgo.setMonth(now.getMonth() - 1);
                return monthAgo;
            case 'year':
                const yearAgo = new Date();
                yearAgo.setFullYear(now.getFullYear() - 1);
                return yearAgo;
            default:
                return new Date(0); // 1970年1月1日
        }
    }

    /**
     * 日付が指定された期間内かどうかを判定
     * @param {string} dateString - 日付文字列
     * @param {string} period - 期間（'week', 'month', 'year'）
     * @returns {boolean} 期間内ならtrue
     */
    static isWithinPeriod(dateString, period) {
        if (!period) return true;

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return false;

        const periodStart = this.getPeriodStartDate(period);
        return date >= periodStart;
    }
}
