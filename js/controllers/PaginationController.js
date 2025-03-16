/**
 * ページネーションを担当するコントローラークラス
 */
class PaginationController {
    /**
     * PaginationControllerのコンストラクタ
     * @param {SearchController} searchController - 検索コントローラー
     */
    constructor(searchController) {
        this.searchController = searchController;

        // DOM要素
        this.elements = {
            prevPage: document.getElementById('prev-page'),
            nextPage: document.getElementById('next-page'),
            currentPage: document.getElementById('current-page'),
            totalPages: document.getElementById('total-pages'),
            itemsPerPage: document.getElementById('items-per-page')
        };
    }

    /**
     * ページネーションを初期化
     */
    async init() {
        // イベントリスナーを設定
        this.elements.prevPage.addEventListener('click', () => this.prevPage());
        this.elements.nextPage.addEventListener('click', () => this.nextPage());
        this.elements.itemsPerPage.addEventListener('change', (e) => this.changeItemsPerPage(e));

        // 初期値を設定
        const searchParams = this.searchController.getSearchParams();
        this.elements.itemsPerPage.value = searchParams.itemsPerPage.toString();

        // データがロードされるのを待つ
        await this.searchController.waitForDataLoad();
        await new Promise(resolve => setTimeout(resolve, 3000));

        // URLパラメータをチェックしてモーダルを開く
        this.checkUrlForModal();
    }

    /**
     * URLパラメータをチェックしてモーダルを開く
     */
    checkUrlForModal() {
        const urlParams = new URLSearchParams(window.location.search);
        const formulaId = urlParams.get('formulaId');
        if (formulaId) {
            const formula = this.searchController.getFormulaById(formulaId);
            if (formula) {
                const uiController = window.app.uiController;
                uiController.openFormulaModal(formula, true); // Pass a flag to indicate initial load
            }
        }
    }

    /**
     * 前のページに移動
     */
    prevPage() {
        const searchParams = this.searchController.getSearchParams();

        if (searchParams.currentPage > 1) {
            searchParams.currentPage--;
            this.searchController.setSearchParams(searchParams);

            // URLパラメータを更新
            UrlUtils.updateUrlParams(searchParams);

            // 検索結果を即時更新
            const filteredFormulas = this.searchController.getFilteredFormulas();
            const startIndex = this.getStartIndex();
            const endIndex = this.getEndIndex();

            // UIControllerのインスタンスを取得して検索結果を更新
            const uiController = window.app.uiController;
            uiController.renderFormulas(filteredFormulas, startIndex, endIndex);
            this.updatePagination();

            return true;
        }

        return false;
    }

    /**
     * 次のページに移動
     */
    nextPage() {
        const searchParams = this.searchController.getSearchParams();
        const filteredFormulas = this.searchController.getFilteredFormulas();
        const totalPages = Math.ceil(filteredFormulas.length / searchParams.itemsPerPage);

        if (searchParams.currentPage < totalPages) {
            searchParams.currentPage++;
            this.searchController.setSearchParams(searchParams);

            // URLパラメータを更新
            UrlUtils.updateUrlParams(searchParams);

            // 検索結果を即時更新
            const startIndex = this.getStartIndex();
            const endIndex = this.getEndIndex();

            // UIControllerのインスタンスを取得して検索結果を更新
            const uiController = window.app.uiController;
            uiController.renderFormulas(filteredFormulas, startIndex, endIndex);
            this.updatePagination();

            return true;
        }

        return false;
    }

    /**
     * 1ページあたりの表示件数を変更
     * @param {Event} event - イベントオブジェクト
     */
    changeItemsPerPage(event) {
        const searchParams = this.searchController.getSearchParams();
        searchParams.itemsPerPage = parseInt(event.target.value);
        searchParams.currentPage = 1;
        this.searchController.setSearchParams(searchParams);

        // URLパラメータを更新
        UrlUtils.updateUrlParams(searchParams);

        // 検索結果を即時更新
        const filteredFormulas = this.searchController.getFilteredFormulas();
        const startIndex = this.getStartIndex();
        const endIndex = this.getEndIndex();

        // UIControllerのインスタンスを取得して検索結果を更新
        const uiController = window.app.uiController;
        uiController.renderFormulas(filteredFormulas, startIndex, endIndex);
        this.updatePagination();

        return true;
    }

    /**
     * ページネーション情報を更新
     */
    updatePagination() {
        const searchParams = this.searchController.getSearchParams();
        const filteredFormulas = this.searchController.getFilteredFormulas();
        const totalPages = Math.ceil(filteredFormulas.length / searchParams.itemsPerPage);

        this.elements.currentPage.textContent = searchParams.currentPage.toString();
        this.elements.totalPages.textContent = totalPages.toString();

        this.elements.prevPage.disabled = searchParams.currentPage <= 1;
        this.elements.nextPage.disabled = searchParams.currentPage >= totalPages;
    }

    /**
     * 現在のページの開始インデックスを取得
     * @returns {number} 開始インデックス
     */
    getStartIndex() {
        const searchParams = this.searchController.getSearchParams();
        return (searchParams.currentPage - 1) * searchParams.itemsPerPage;
    }

    /**
     * 現在のページの終了インデックスを取得
     * @returns {number} 終了インデックス
     */
    getEndIndex() {
        const searchParams = this.searchController.getSearchParams();
        return this.getStartIndex() + searchParams.itemsPerPage;
    }
}
