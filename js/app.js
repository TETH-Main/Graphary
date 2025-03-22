/**
 * アプリケーションのメインクラス
 */
class App {
    /**
     * Appのコンストラクタ
     */
    constructor() {
        // サービスとコントローラーの初期化
        this.dataService = new DataService();
        this.searchController = new SearchController(this.dataService);
        this.reportRegister = new ReportRegister();
        this.lang = getLanguage();
        this.uiController = new UIController(this.dataService, this.searchController, this.reportRegister, this.lang);
        this.paginationController = new PaginationController(this.searchController);

        // DOM要素
        this.elements = {
            keywordSearch: document.getElementById('keyword-search'),
            sortSelect: document.getElementById('sort-select'),
            langButtons: document.querySelectorAll('.lang-button')
        };

        this.formulaRegister = new FormulaRegister();
        this.registerModal = document.getElementById('register-modal');
        this.registerFab = document.getElementById('register-fab');
        this.registerModalClose = document.getElementById('register-modal-close');
    }

    /**
     * ハンバーガーメニューの設定
     */
    setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav .nav-link');
        const body = document.body;

        // ハンバーガーメニューのクリックイベント
        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            body.classList.toggle('menu-open'); // スクロール防止

            // メニューが開いたときに背景エフェクトのアニメーションを追加
            if (mobileMenu.classList.contains('active')) {
                this.animateMenuBackground();
            }
        });

        // モバイルメニューのリンクをクリックしたときの処理
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                // メニューを閉じる前にアニメーション
                this.closeMenuWithAnimation(() => {
                    // アニメーション完了後の処理
                    hamburgerMenu.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    body.classList.remove('menu-open');

                    // アクティブなリンクを更新
                    mobileNavLinks.forEach(navLink => navLink.classList.remove('active'));
                    link.classList.add('active');

                    // メインナビのアクティブ状態も更新
                    const mainNavLinks = document.querySelectorAll('.main-nav .nav-link');
                    const targetPage = link.getAttribute('data-page');
                    mainNavLinks.forEach(navLink => {
                        if (navLink.getAttribute('data-page') === targetPage) {
                            navLink.classList.add('active');
                        } else {
                            navLink.classList.remove('active');
                        }
                    });
                });
            });
        });
    }

    /**
     * メニュー背景のアニメーション
     */
    animateMenuBackground() {
        const backgroundEffect = document.querySelector('.menu-background-effect');

        // 初期位置をリセット
        backgroundEffect.style.opacity = '0';

        // アニメーションのタイミングを少し遅らせる
        setTimeout(() => {
            backgroundEffect.style.opacity = '1';
        }, 100);
    }

    /**
     * アニメーション付きでメニューを閉じる
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    closeMenuWithAnimation(callback) {
        const mobileNavItems = document.querySelectorAll('.mobile-nav li');
        const mobileMenuFooter = document.querySelector('.mobile-menu-footer');
        const backgroundEffect = document.querySelector('.menu-background-effect');

        // 各要素を逆順にフェードアウト
        mobileMenuFooter.style.opacity = '0';
        mobileMenuFooter.style.transform = 'translateY(20px)';

        // メニュー項目を逆順にフェードアウト
        mobileNavItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
            }, index * 50);
        });

        // 背景エフェクトをフェードアウト
        backgroundEffect.style.opacity = '0';

        // アニメーション完了後にコールバックを実行
        setTimeout(() => {
            // スタイルをリセット
            mobileNavItems.forEach(item => {
                item.removeAttribute('style');
            });
            mobileMenuFooter.removeAttribute('style');
            backgroundEffect.removeAttribute('style');

            if (callback) callback();
        }, 300);
    }

    /**
     * ページナビゲーションを設定
     */
    setupPageNavigation() {
        const allNavLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        allNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                const targetPage = link.getAttribute('data-page');

                // アクティブなリンクとページを更新
                allNavLinks.forEach(navLink => {
                    if (navLink.getAttribute('data-page') === targetPage) {
                        navLink.classList.add('active');
                    } else {
                        navLink.classList.remove('active');
                    }
                });

                pages.forEach(page => {
                    if (page.id === `${targetPage}-page`) {
                        page.classList.add('active');
                    } else {
                        page.classList.remove('active');
                    }
                });

                // ページトップにスクロール
                window.scrollTo(0, 0);
            });
        });
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        // ハンバーガーメニューを設定
        this.setupHamburgerMenu();

        // ページナビゲーションを設定
        this.setupPageNavigation();

        // イベントリスナーを設定
        this.setupEventListeners();

        // 言語切替ボタンのイベントを設定
        this.setupLanguageSwitchEvents();

        // ページネーションを初期化
        this.paginationController.init();

        // URLパラメータを適用
        this.applyUrlParams();

        // データを取得
        this.uiController.toggleLoading(true);
        const success = await this.dataService.fetchData();

        if (success) {
            // タグと数式タイプを表示
            this.uiController.renderTags();
            this.uiController.renderFormulaTypes();

            // 検索を実行
            this.searchController.search();

            // 数式を表示
            this.renderCurrentPage();
        } else {
            // エラーメッセージを表示
            document.getElementById('loading').innerHTML = 'データの取得に失敗しました。後でもう一度お試しください。';
        }

        this.uiController.toggleLoading(false);

        // フローティングボタンとモーダルのイベントリスナーを設定
        this.setupRegisterModalEvents();
    }

    /**
     * 言語切替ボタンのイベントを設定
     */
    setupLanguageSwitchEvents() {
        this.elements.langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newLang = button.getAttribute('data-lang');
                
                // 言語を更新
                this.lang = newLang;
                
                // UIControllerに言語変更を通知
                this.uiController.switchLanguage(newLang);
            });
        });
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // キーワード検索
        this.elements.keywordSearch.addEventListener('input', () => {
            const searchParams = this.searchController.getSearchParams();
            searchParams.keyword = this.elements.keywordSearch.value;
            this.searchController.setSearchParams(searchParams);
            this.searchController.search();
            this.renderCurrentPage();
        });

        // ソート機能
        this.elements.sortSelect.addEventListener('change', () => {
            const sortOption = this.elements.sortSelect.value;
            this.searchController.sort(sortOption);
            this.renderCurrentPage();
        });
    }

    /**
     * URLパラメータを適用
     */
    applyUrlParams() {
        const urlParams = UrlUtils.getSearchParamsFromUrl();

        // 検索パラメータを設定
        this.searchController.setSearchParams(urlParams);

        // UI要素に値を設定
        if (urlParams.keyword) {
            this.elements.keywordSearch.value = urlParams.keyword;
        }

        if (urlParams.sortOption) {
            this.elements.sortSelect.value = urlParams.sortOption;
        }
    }

    /**
     * 現在のページの数式を表示
     */
    renderCurrentPage() {
        const filteredFormulas = this.searchController.getFilteredFormulas();
        const startIndex = this.paginationController.getStartIndex();
        const endIndex = this.paginationController.getEndIndex();

        this.uiController.renderFormulas(filteredFormulas, startIndex, endIndex);
        this.paginationController.updatePagination();
    }

    /**
     * フローティングボタンとモーダルのイベントリスナーを設定
     */
    setupRegisterModalEvents() {
        this.registerFab.addEventListener('click', () => {
            this.registerModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        this.registerModalClose.addEventListener('click', () => {
            this.registerModal.classList.add('hidden');
            document.body.style.overflow = '';
        });

        this.registerModal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.registerModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app; // グローバルに app インスタンスを公開
    app.init();
});
