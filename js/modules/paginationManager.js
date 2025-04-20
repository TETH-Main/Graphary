/**
 * ページネーションを管理するクラス
 */
export class PaginationManager {
    /**
     * @param {HTMLElement} container ページネーションを表示するコンテナ
     * @param {Function} onPageChange ページ変更時のコールバック関数
     * @param {Object} languageManager 言語管理サービス
     */
    constructor(container, onPageChange, languageManager) {
        this.container = container;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.onPageChange = onPageChange;
        this.languageManager = languageManager;
    }

    /**
     * 表示件数を設定
     * @param {number} count 1ページあたりの表示件数
     */
    setItemsPerPage(count) {
        this.itemsPerPage = count;
        this.currentPage = 1; // ページ数変更時は1ページ目に戻す
    }

    /**
     * 総アイテム数を設定
     * @param {number} count 総アイテム数
     */
    setTotalItems(count) {
        this.totalItems = count;
    }

    /**
     * 現在のページを取得
     * @returns {number} 現在のページ番号
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * 1ページあたりの表示件数を取得
     * @returns {number} 表示件数
     */
    getItemsPerPage() {
        return this.itemsPerPage;
    }

    /**
     * 表示対象のアイテム範囲を計算
     * @returns {Object} {startIndex, endIndex} 表示対象の開始と終了インデックス
     */
    getItemRange() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.totalItems);
        
        return { startIndex, endIndex };
    }

    /**
     * 総ページ数を計算
     * @returns {number} 総ページ数
     */
    getTotalPages() {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    /**
     * ページネーションを描画
     */
    render() {
        this.container.innerHTML = ''; // Clear previous pagination
        this.container.className = 'pagination'; // Ensure the container has the pagination class

        const totalPages = this.getTotalPages();

        // ページがない場合は何も表示しない
        if (totalPages <= 0) {
            return;
        }

        // 表示するページ番号の範囲を決定
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4 && totalPages > 5) {
            if (startPage === 1) {
                endPage = 5;
            } else if (endPage === totalPages) {
                startPage = Math.max(1, totalPages - 4);
            }
        }

        // 前のページボタン
        if (this.currentPage > 1) {
            this.createPageButton('&laquo;', () => this.changePage(this.currentPage - 1), false, ['page-button-prev']);
        }

        // 最初のページボタンと省略記号
        if (startPage > 1) {
            this.createPageButton('1', () => this.changePage(1));

            // 省略表示
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                this.container.appendChild(ellipsis);
            }
        }

        // ページ番号ボタン
        for (let i = startPage; i <= endPage; i++) {
            this.createPageButton(i.toString(), () => this.changePage(i), i === this.currentPage);
        }

        // 最後のページボタンと省略記号
        if (endPage < totalPages) {
            // 省略表示
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                this.container.appendChild(ellipsis);
            }

            this.createPageButton(totalPages.toString(), () => this.changePage(totalPages));
        }

        // 次のページボタン
        if (this.currentPage < totalPages) {
            this.createPageButton('&raquo;', () => this.changePage(this.currentPage + 1), false, ['page-button-next']);
        }

        // ページ情報を追加
        const { startIndex, endIndex } = this.getItemRange();
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';

        if (this.languageManager) {
            pageInfo.textContent = this.languageManager.translate(
                'pageInfo', startIndex + 1, endIndex, this.totalItems);
        } else {
            // Fallback text if languageManager is not available
            pageInfo.textContent = `${startIndex + 1} - ${endIndex} 件表示 / 全 ${this.totalItems} 件`;
        }

        this.container.appendChild(pageInfo);
    }

    /**
     * ページ切り替えボタンを作成
     * @param {string} text ボタンテキスト
     * @param {Function} onClick クリック時の処理
     * @param {boolean} isActive アクティブ状態か
     * @param {string[]} [additionalClasses=[]] 追加するCSSクラス
     */
    createPageButton(text, onClick, isActive = false, additionalClasses = []) {
        const button = document.createElement('button');
        button.className = 'page-button';
        if (isActive) {
            button.classList.add('active');
        }
        if (additionalClasses.length > 0) {
            button.classList.add(...additionalClasses);
        }
        button.innerHTML = text;
        button.addEventListener('click', () => {
            onClick();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        this.container.appendChild(button);
    }

    /**
     * ページを変更
     * @param {number} page ページ番号
     */
    changePage(page) {
        // Prevent changing to the same page
        if (page === this.currentPage || page < 1 || page > this.getTotalPages()) return;

        this.currentPage = page;

        // コールバック関数を呼び出し
        if (this.onPageChange) {
            this.onPageChange();
        }
    }

    /**
     * 現在のページを直接設定する
     * @param {number} pageNumber 設定するページ番号
     */
    setCurrentPage(pageNumber) {
        const page = parseInt(pageNumber) || 1;
        const totalPages = this.getTotalPages();
        
        // ページ番号が有効範囲内かチェック
        if (page < 1) {
            this.currentPage = 1;
        } else if (totalPages > 0 && page > totalPages) {
            this.currentPage = totalPages;
        } else {
            this.currentPage = page;
        }
    }
}
