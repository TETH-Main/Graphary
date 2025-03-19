/**
 * URL関連のユーティリティクラス
 */
class UrlUtils {
    /**
     * 検索条件をURLパラメータに反映
     * @param {Object} searchParams - 検索パラメータ
     */
    static updateUrlParams(searchParams) {
        const params = new URLSearchParams(window.location.search);

        if (searchParams.keyword) {
            params.set('q', searchParams.keyword);
        } else {
            params.delete('q');
        }

        if (searchParams.selectedTags && searchParams.selectedTags.length > 0) {
            params.set('tags', searchParams.selectedTags.join(','));
        } else {
            params.delete('tags');
        }

        if (searchParams.selectedFormulaTypes && searchParams.selectedFormulaTypes.length > 0) {
            params.set('types', searchParams.selectedFormulaTypes.join(','));
        } else {
            params.delete('types');
        }

        if (searchParams.sortOption && searchParams.sortOption !== 'date-desc') {
            params.set('sort', searchParams.sortOption);
        }

        if (searchParams.itemsPerPage && searchParams.itemsPerPage !== 12) {
            params.set('items', searchParams.itemsPerPage.toString());
        }

        if (searchParams.currentPage && searchParams.currentPage > 1) {
            params.set('page', searchParams.currentPage.toString());
        }

        // Preserve existing formulaId parameter
        const formulaId = params.get('formulaId');
        if (formulaId) {
            params.set('formulaId', formulaId);
        }

        const newUrl = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;

        window.history.replaceState({}, '', newUrl);
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