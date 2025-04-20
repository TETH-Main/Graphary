/**
 * URL操作ユーティリティクラス
 * クエリパラメータの管理を担当
 */
export class UrlUtils {
    /**
     * 現在のURLからクエリパラメータを読み取る
     * @returns {Object} パラメータオブジェクト
     */
    static getQueryParams() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const params = {};

        // ソート順
        params.sort = urlParams.get('sort') || 'id-asc';
        
        // 1ページあたりの表示件数
        params.items = parseInt(urlParams.get('items')) || 10;
        
        // 現在のページ
        params.page = parseInt(urlParams.get('page')) || 1;
        
        // 検索クエリ
        params.search = urlParams.get('q') || '';
        
        // タグフィルター (カンマ区切りで複数可能)
        const tagsParam = urlParams.get('tags');
        params.tags = tagsParam && tagsParam !== 'undefined' ? tagsParam.split(',') : [];
        
        // 数式タイプフィルター
        params.formulaType = urlParams.get('types') || '';
        
        // モーダル表示用の数式ID
        params.formulaId = urlParams.get('formulaId') || '';

        return params;
    }

    /**
     * クエリパラメータをURLに設定
     * @param {Object} params パラメータオブジェクト
     * @param {boolean} replace URLを置き換えるか(true)、履歴に追加するか(false)
     */
    static setQueryParams(params, replace = true) {
        const urlParams = new URLSearchParams();
        
        // ソート順
        if (params.sort && params.sort !== 'id-asc') {
            urlParams.set('sort', params.sort);
        }
        
        // 1ページあたりの表示件数 (デフォルトと異なる場合のみ設定)
        if (params.items && params.items !== 10) {
            urlParams.set('items', params.items);
        }
        
        // 現在のページ (1ページ目でない場合のみ設定)
        if (params.page && params.page > 1) {
            urlParams.set('page', params.page);
        }
        
        // 検索クエリ (空でない場合のみ設定)
        if (params.search && params.search.trim() !== '') {
            urlParams.set('q', params.search);
        }
        
        // タグフィルター (空でない場合のみ設定)
        if (params.tags && params.tags.length > 0) {
            urlParams.set('tags', params.tags.join(','));
        }
        
        // 数式タイプフィルター (空でない場合のみ設定)
        if (params.formulaType && params.formulaType !== '') {
            urlParams.set('types', params.formulaType);
        }
        
        // モーダル表示用の数式ID (空でない場合のみ設定)
        if (params.formulaId && params.formulaId !== '') {
            urlParams.set('formulaId', params.formulaId);
        }
        
        // クエリパラメータが存在する場合、URLを更新
        const queryString = urlParams.toString();
        const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        
        if (replace) {
            // 履歴を置き換え
            window.history.replaceState({}, '', newUrl);
        } else {
            // 履歴に追加
            window.history.pushState({}, '', newUrl);
        }
    }

    /**
     * 特定のパラメータのみを更新
     * @param {string} param パラメータ名
     * @param {any} value パラメータ値
     * @param {boolean} replace URLを置き換えるか(true)、履歴に追加するか(false)
     */
    static updateQueryParam(param, value, replace = true) {
        const params = this.getQueryParams();
        params[param] = value;
        this.setQueryParams(params, replace);
    }

    /**
     * 指定されたパラメータを削除
     * @param {string} param 削除するパラメータ名
     * @param {boolean} replace URLを置き換えるか(true)、履歴に追加するか(false)
     */
    static removeQueryParam(param, replace = true) {
        const params = this.getQueryParams();
        delete params[param];
        this.setQueryParams(params, replace);
    }

    /**
     * モーダル表示用の数式IDを設定
     * @param {string} formulaId 数式ID
     * @param {boolean} replace URLを置き換えるか
     */
    static setFormulaId(formulaId, replace = true) {
        this.updateQueryParam('formulaId', formulaId, replace);
    }

    /**
     * モーダル表示用の数式IDを削除
     * @param {boolean} replace URLを置き換えるか
     */
    static clearFormulaId(replace = true) {
        this.removeQueryParam('formulaId', replace);
    }
}
