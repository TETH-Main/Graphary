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
        // 修正: formulaTypeとformula_typeの両方に対応
        this.formulaType = data.formula_type || data.formulaType || '';
        this.tags = Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(tag => tag.trim()) : []);
        this.formula = data.formula || '';
        // 修正: imageUrlとimage_urlの両方に対応
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
            // 両方のプロパティ名に対応
            formula_type: entry.formula_type || entry.formulaType || '',
            tags: entry.tags || [],
            formula: entry.formula || '',
            // 両方のプロパティ名に対応
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
