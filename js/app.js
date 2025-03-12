/**
 * アプリケーションのメインクラス
 */
class App {
    /**
     * Appのコンストラクタ
     */
    constructor() {
        // 隠しコマンド（難読化）
        this.secretCommandHash = "781d3938f9ca2529f3766c6ca51a1d8477ccbb9f6fa35d90db7d4d9f6207d59f"; // SHA-256 ハッシュ値
        this.secretCommandInserted = false;

        // サービスとコントローラーの初期化
        this.dataService = new DataService();
        this.searchController = new SearchController(this.dataService);
        this.uiController = new UIController(this.dataService, this.searchController);
        this.paginationController = new PaginationController(this.searchController);

        // DOM要素
        this.elements = {
            keywordSearch: document.getElementById('keyword-search'),
            sortSelect: document.getElementById('sort-select')
        };
    }

    /**
 * ページナビゲーションを設定
 */
setupPageNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetPage = link.getAttribute('data-page');
        
        // アクティブなリンクとページを更新
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        link.classList.add('active');
        
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`${targetPage}-page`).classList.add('active');
        
        // ページトップにスクロール
        window.scrollTo(0, 0);
      });
    });
  }

    /**
     * 隠しコマンド関連の要素を動的に挿入
     */
    insertSecretCommandElements() {
        // filter-group 要素を作成
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group';

        // 隠しコマンドラベルを作成
        const commandLabel = document.createElement('label');
        commandLabel.for = 'episode-filter';
        commandLabel.textContent = '私が好きなアーティストは？';

        // コマンド入力フィールドを作成
        const commandInput = document.createElement('input');
        commandInput.type = 'text';
        commandInput.id = 'command-input';
        commandInput.className = 'command-input';
        commandInput.placeholder = 'コマンドを入力...';

        // 限定公開動画表示エリアを作成
        const secretArt = document.createElement('div');
        secretArt.id = 'secret-formulas';
        secretArt.className = 'secret-formulas hidden';

        const secretTitle = document.createElement('h3');
        secretTitle.textContent = '隠し関数アート';

        const secretFormulaList = document.createElement('ul');
        secretFormulaList.id = 'secret-formula-list';

        secretArt.appendChild(secretTitle);
        secretArt.appendChild(secretFormulaList);

        // 要素を追加
        filterGroup.appendChild(commandLabel);
        filterGroup.appendChild(commandInput);
        filterGroup.appendChild(secretArt);

        // 検索セクションに追加
        const searchContainer = document.querySelector('.search-container');
        searchContainer.parentNode.appendChild(filterGroup);

        // UIControllerの要素参照を更新
        this.uiController.updateSecretElements(secretArt, secretFormulaList);

        // コマンド入力イベントリスナーを設定
        commandInput.addEventListener('input', (e) => {
            this.validateSecretCommand(e.target.value);
        });

        this.secretCommandInserted = true;
        this.elements.commandInput = commandInput;
    }


    /**
     * 入力値のハッシュを計算、検証
     * @param {string} input - 入力されたコマンド
     */
    async checkHash(input) {
        const sha256 = async (str) => {
            const utf8 = new TextEncoder().encode(str);
            const digest = await crypto.subtle.digest('SHA-256', utf8);
            return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, '0')).join('');
        };

        const inputHash = await sha256(input);
        console.log(inputHash);
        if (inputHash === this.secretCommandHash) return true;
        else return false;
    }

    /**
     * 隠しコマンドを検証
     * @param {string} input - 入力されたコマンド
     */
    validateSecretCommand(input) {
        if (this.checkHash(input)) {
            const secretArt = document.getElementById('secret-formulas');
            if (secretArt) {
                secretArt.classList.remove('hidden');
                // UIControllerの要素が正しく設定されていることを確認してから呼び出す
                if (this.uiController.elements.secretArt && this.uiController.elements.secretFormulaList) {
                    this.uiController.showsecretArt();
                }
            }
        } else {
            const secretArt = document.getElementById('secret-formulas');
            if (secretArt) {
                secretArt.classList.add('hidden');
            }
        }
    }

/**
 * アプリケーションを初期化
 */
async init() {
    // ページナビゲーションを設定
    this.setupPageNavigation();
    
    // イベントリスナーを設定
    this.setupEventListeners();
    
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

        // 隠しコマンド
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 's') {
                if (!this.secretCommandInserted) {
                    this.insertSecretCommandElements();
                } else {
                    // すでに挿入されている場合は表示/非表示を切り替え
                    const commandInput = document.getElementById('command-input');
                    if (commandInput) {
                        commandInput.classList.toggle('hidden');
                    }
                }
            }
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
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app; // グローバルに app インスタンスを公開
    app.init();
});
