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
        this.filteredFormulas = this.dataService.filterFormulas(this.searchParams);

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
}