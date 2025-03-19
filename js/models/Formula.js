/**
 * 数式データのモデルクラス
 */
class Formula {
    /**
     * 数式モデルのコンストラクタ
     * @param {Object} data - 数式データオブジェクト
     */
    constructor(data) {
        this.id = data.id || '';
        this.title = data.title || '';
        this.title_EN = data.title_EN || '';
        this.formulaType = data.formula_type || data.formulaType || '';
        this.tags = Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(tag => tag.trim()) : []);
        this.formula = data.formula || '';
        this.imageUrl = data.image_url || data.imageUrl || '';
    }

    /**
     * スプレッドシートのデータから数式オブジェクトを作成
     * @param {Object} entry - スプレッドシートのエントリ
     * @returns {Formula} 数式オブジェクト
     */
    static fromSpreadsheetEntry(entry) {
        // デバッグログを削除
        
        return new Formula({
            id: entry.id || '',
            title: entry.title || '',
            title_EN: entry.title_EN || '',
            formula_type: entry.formula_type || entry.formulaType || '',
            tags: entry.tags || [],
            formula: entry.formula || '',
            image_url: entry.image_url || entry.imageUrl || ''
        });
    }

    /**
     * 画像URLを取得（なければデフォルト画像を使用）
     * @returns {string} 画像URL
     */
    getImageUrl() {
        return this.imageUrl || '/placeholder.svg?height=300&width=300';
    }
}
