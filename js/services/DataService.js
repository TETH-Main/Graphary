/**
 * データ取得と処理を担当するサービスクラス
 */
class DataService {
    /**
     * DataServiceのコンストラクタ
     */
    constructor() {
        this.formulas = [];
        this.tags = new Set();
        this.formulaTypes = new Set(); // 数式タイプを保存するセット
    }

    /**
     * Google Spreadsheetからデータを取得
     * @returns {Promise<boolean>} 成功したらtrue、失敗したらfalse
     */
    async fetchData() {
        try {
            const url = 'https://script.google.com/macros/s/AKfycby1uK606WpIBfn6oxRaALBsUDgL4RO0Z6KYap5H_kaf9P8MCHX8ywfadbW8A53QiLjt4Q/exec?id=139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM&name=data';

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // データの処理
            this.processData(data);
            return true;
        } catch (error) {
            console.error('データの取得に失敗しました:', error);
            return false;
        }
    }

    /**
     * 取得したデータを処理
     * @param {Array} data - APIから取得したデータ
     */
    processData(data) {
        // データ形式に応じて処理を変更
        this.formulas = data.map(entry => Formula.fromSpreadsheetEntry(entry));

        // すべてのタグを収集
        this.collectTags();
        this.collectFormulaTypes();
    }

    /**
       * すべての数式からタグを収集
       */
    collectTags() {
        this.tags.clear();
        this.formulas.forEach(formula => {
            formula.tags.forEach(tag => {
                if (tag) this.tags.add(tag);
            });
        });
    }

    /**
     * すべての数式から数式タイプを収集
     */
    collectFormulaTypes() {
        this.formulaTypes.clear();
        this.formulas.forEach(formula => {
            if (formula.formulaType) {
                // カンマで区切られた複数のタイプを処理
                const types = formula.formulaType.split(',').map(type => type.trim());
                types.forEach(type => {
                    if (type) this.formulaTypes.add(type);
                });
            }
        });
    }

    /**
     * 検索条件に基づいて数式をフィルタリング
     * @param {Object} searchParams - 検索パラメータ
     * @returns {Array} フィルタリングされた数式の配列
     */
    filterFormulas(searchParams) {
        const { keyword, selectedTags, selectedFormulaTypes } = searchParams;

        return this.formulas.filter(formula => {
            // キーワード検索
            const matchesKeyword = !keyword ||
                formula.formula.toLowerCase().includes(keyword.toLowerCase()) ||
                formula.formulaType.toLowerCase().includes(keyword.toLowerCase()) ||
                (formula.title && formula.title.toLowerCase().includes(keyword.toLowerCase())) || // タイトル検索を追加
                formula.id.toString().includes(keyword);

            // タグ検索
            const matchesTags = !selectedTags || selectedTags.length === 0 ||
                selectedTags.every(tag => formula.tags.includes(tag));

            // 数式タイプ検索
            const matchesFormulaTypes = !selectedFormulaTypes || selectedFormulaTypes.length === 0 ||
                selectedFormulaTypes.some(type => {
                    // 数式タイプがカンマ区切りの場合を考慮
                    const formulaTypes = formula.formulaType.split(',').map(t => t.trim());
                    return formulaTypes.includes(type);
                });

            return matchesKeyword && matchesTags && matchesFormulaTypes;
        });
    }

    /**
     * 数式を指定された条件でソート
     * @param {Array} formulas - ソートする数式の配列
     * @param {string} sortOption - ソートオプション
     * @returns {Array} ソートされた数式の配列
     */
    sortFormulas(formulas, sortOption) {
        const sortedFormulas = [...formulas];

        switch (sortOption) {
            case 'id-asc': // ID昇順
                sortedFormulas.sort((a, b) => a.id - b.id);
                break;
            case 'id-desc': // ID降順
                sortedFormulas.sort((a, b) => b.id - a.id);
                break;
            case 'type-asc': // タイプ昇順
                sortedFormulas.sort((a, b) => a.formulaType.localeCompare(b.formulaType));
                break;
            case 'type-desc': // タイプ降順
                sortedFormulas.sort((a, b) => b.formulaType.localeCompare(a.formulaType));
                break;
        }

        return sortedFormulas;
    }

    /**
     * タグの使用頻度を集計
     * @returns {Object} タグとその使用頻度のマップ
     */
    getTagCounts() {
        const tagCounts = {};

        this.formulas.forEach(formula => {
            formula.tags.forEach(tag => {
                if (tag) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            });
        });

        return tagCounts;
    }

    /**
     * すべての数式タイプを取得
     * @returns {Array} 数式タイプの配列
     */
    getAllFormulaTypes() {
        return Array.from(this.formulaTypes).sort();
    }

    /**
     * 使用頻度順にソートされたタグを取得
     * @param {number} limit - 取得するタグの最大数
     * @returns {Array} タグの配列
     */
    getPopularTags(limit = 15) {
        const tagCounts = this.getTagCounts();

        // 使用頻度順にソート
        return Object.keys(tagCounts)
            .sort((a, b) => tagCounts[b] - tagCounts[a])
            .slice(0, limit);
    }

    /**
     * すべてのタグを取得
     * @returns {Array} タグの配列
     */
    getAllTags() {
        return Array.from(this.tags).sort();
    }
}
