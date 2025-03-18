/**
 * 検索機能を担当するコントローラークラス
 */
class SearchController {
    /**
     * SearchControllerのコンストラクタ
     * @param {DataService} dataService - データサービス
     */
    constructor(dataService) {
        this.dataService = dataService;

        // 検索パラメータ
        this.searchParams = {
            keyword: '',
            selectedTags: [],
            selectedFormulaTypes: [],
            sortOption: 'id-asc',
            currentPage: 1,
            itemsPerPage: 10
        };

        // フィルタリングされた数式
        this.filteredFormulas = [];
    }

    /**
     * 検索パラメータを設定
     * @param {Object} params - 検索パラメータ
     */
    setSearchParams(params) {
        Object.assign(this.searchParams, params);
    }

    /**
     * 検索パラメータを取得
     * @returns {Object} 検索パラメータ
     */
    getSearchParams() {
        return { ...this.searchParams };
    }

    /**
     * 選択されたタグを取得
     * @returns {Array} 選択されたタグの配列
     */
    getSelectedTags() {
        return [...this.searchParams.selectedTags];
    }

    /**
     * 選択された数式タイプを取得
     * @returns {Array} 選択された数式タイプの配列
     */
    getSelectedFormulaTypes() {
        return [...this.searchParams.selectedFormulaTypes];
    }

    /**
     * タグの選択・非選択を切り替え
     * @param {string} tag - タグ
     */
    toggleTag(tag) {
        const index = this.searchParams.selectedTags.indexOf(tag);

        if (index === -1) {
            this.searchParams.selectedTags.push(tag);
        } else {
            this.searchParams.selectedTags.splice(index, 1);
        }

        // 検索を実行
        this.search();
    }

    /**
     * 数式タイプの選択・非選択を切り替え
     * @param {string} type - 数式タイプ
     */
    toggleFormulaType(type) {
        const index = this.searchParams.selectedFormulaTypes.indexOf(type);

        if (index === -1) {
            this.searchParams.selectedFormulaTypes.push(type);
        } else {
            this.searchParams.selectedFormulaTypes.splice(index, 1);
        }

        // 検索を実行
        this.search();
    }

    /**
     * 検索を実行
     */
    search() {
        // 現在のページを1に戻す
        this.searchParams.currentPage = 1;

        // 数式をフィルタリング
        this.filteredFormulas = this._filterFormulas();

        // 数式をソート
        this.filteredFormulas = this.dataService.sortFormulas(
            this.filteredFormulas,
            this.searchParams.sortOption
        );

        // URLパラメータを更新
        UrlUtils.updateUrlParams(this.searchParams);

        return this.filteredFormulas;
    }

    /**
     * 数式をフィルタリング（言語に依存しない検索対応）
     * @returns {Array} フィルタリングされた数式の配列
     * @private
     */
    _filterFormulas() {
        const { keyword, selectedTags, selectedFormulaTypes } = this.searchParams;
        
        // タグID配列を準備（言語非依存の検索のため）
        const selectedTagIds = [];
        if (selectedTags && selectedTags.length > 0) {
            selectedTags.forEach(tagName => {
                const tagId = this.dataService.getTagIdByName(tagName);
                if (tagId) {
                    selectedTagIds.push(tagId);
                }
            });
        }

        return this.dataService.formulas.filter(formula => {
            // キーワード検索
            const matchesKeyword = !keyword ||
                formula.formula.toLowerCase().includes(keyword.toLowerCase()) ||
                formula.formulaType.toLowerCase().includes(keyword.toLowerCase()) ||
                (formula.title && formula.title.toLowerCase().includes(keyword.toLowerCase())) ||
                (formula.title_EN && formula.title_EN.toLowerCase().includes(keyword.toLowerCase())) ||
                formula.id.toString().includes(keyword);

            // タグ検索 - タグIDを使用
            const matchesTags = !selectedTags || selectedTags.length === 0 ||
                selectedTags.every(tagName => {
                    // タグ名が直接一致する場合
                    if (formula.tags.includes(tagName)) {
                        return true;
                    }
                    
                    // タグIDを使用して一致するか確認
                    const tagId = this.dataService.getTagIdByName(tagName);
                    return tagId && formula.tagIds && formula.tagIds.includes(tagId);
                });

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
     * 並び替えを実行
     * @param {string} sortOption - ソートオプション
     */
    sort(sortOption) {
        this.searchParams.sortOption = sortOption;

        // 数式をソート
        this.filteredFormulas = this.dataService.sortFormulas(
            this.filteredFormulas,
            this.searchParams.sortOption
        );

        // URLパラメータを更新
        UrlUtils.updateUrlParams(this.searchParams);

        return this.filteredFormulas;
    }

    /**
     * フィルタリングされた数式を取得
     * @returns {Array} フィルタリングされた数式の配列
     */
    getFilteredFormulas() {
        return [...this.filteredFormulas];
    }

    /**
     * IDから数式を取得
     * @param {string} id - 数式のID
     * @returns {Formula|null} 数式オブジェクトまたはnull
     */
    getFormulaById(id) {
        const formulas = this.getFilteredFormulas();
        return formulas.find(formula => formula.id == id) || null;
    }

    /**
     * データがロードされるまで待つ
     * @returns {Promise<void>}
     */
    waitForDataLoad() {
        return this.dataService.waitForDataLoad();
    }

    /**
     * データサービスがセットされているかどうかを確認
     * @returns {boolean} データサービスがセットされているかどうか
     */
    isDataServiceSet() {
        return this.dataService !== null && this.dataService !== undefined;
    }

    /**
     * URLパラメータから検索条件を取得
     * @returns {Object} 検索パラメータ
     */
    static getSearchParamsFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const searchParams = {};

        if (params.has('q')) {
            searchParams.keyword = params.get('q');
        }

        if (params.has('tags')) {
            searchParams.selectedTags = params.get('tags').split(',');
        }

        if (params.has('types')) {
            searchParams.selectedFormulaTypes = params.get('types').split(',');
        }

        if (params.has('sort')) {
            searchParams.sortOption = params.get('sort');
        }

        if (params.has('items')) {
            searchParams.itemsPerPage = parseInt(params.get('items'));
        }

        if (params.has('page')) {
            searchParams.currentPage = parseInt(params.get('page'));
        }

        return searchParams;
    }
}