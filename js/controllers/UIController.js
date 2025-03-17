/**
 * UI表示と操作を担当するコントローラークラス
 */
class UIController {
    /**
     * UIControllerのコンストラクタ
     * @param {DataService} dataService - データサービス
     * @param {SearchController} searchController - 検索コントローラー
     * @param {ReportRegister} reportRegister - 報告機能
     */
    constructor(dataService, searchController, reportRegister) {
        this.dataService = dataService;
        this.searchController = searchController;
        this.reportRegister = reportRegister;

        // DOM要素
        this.elements = {
            keywordSearch: document.getElementById('keyword-search'),
            tagContainer: document.getElementById('tag-container'),
            formulaTypeContainer: document.getElementById('formula-type-container'), // 追加
            formulaGrid: document.getElementById('formula-grid'),
            loading: document.getElementById('loading'),
            tagCloud: document.getElementById('tag-cloud'),
            sortSelect: document.getElementById('sort-select'),
            formulaModal: document.getElementById('formula-modal'),
            modalContent: document.getElementById('modal-content'),
            modalClose: document.getElementById('modal-close'),
            reportButton: document.getElementById('report-button')
        };
        
        // モーダル閉じるボタンのイベントリスナー
        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => this.closeModal());
        }
        
        // モーダルオーバーレイクリックでも閉じる
        if (this.elements.formulaModal) {
            this.elements.formulaModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());
        }
        
        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.formulaModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    /**
     * 隠しコマンド関連の要素参照を更新
     * @param {HTMLElement} secretFormulasElement - 隠し関数アートコンテナ要素
     * @param {HTMLElement} secretFormulaListElement - 隠し関数アートリスト要素
     */
    updateSecretElements(secretFormulasElement, secretFormulaListElement) {
        this.elements.secretFormulas = secretFormulasElement;
        this.elements.secretFormulaList = secretFormulaListElement;
    }

    /**
     * タグを表示
     */
    renderTags() {
        this.elements.tagContainer.innerHTML = '';

        const allTags = this.dataService.getAllTags();
        const selectedTags = this.searchController.getSelectedTags();

        allTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.textContent = tag;

            if (selectedTags.includes(tag)) {
                tagElement.classList.add('selected');
            }

            tagElement.addEventListener('click', () => {
                this.searchController.toggleTag(tag);
                this.renderTags();

                // 検索結果を即時更新するための追加コード
                const filteredFormulas = this.searchController.getFilteredFormulas();
                const paginationController = window.app.paginationController;
                const startIndex = paginationController.getStartIndex();
                const endIndex = paginationController.getEndIndex();
                this.renderFormulas(filteredFormulas, startIndex, endIndex);
                paginationController.updatePagination();
            });

            this.elements.tagContainer.appendChild(tagElement);
        });
    }

    /**
     * 数式を表示
     * @param {Array} formulas - 表示する数式の配列
     * @param {number} startIndex - 開始インデックス
     * @param {number} endIndex - 終了インデックス
     */
    renderFormulas(formulas, startIndex, endIndex) {
        this.elements.formulaGrid.innerHTML = '';

        const formulasToShow = formulas.slice(startIndex, endIndex);

        if (formulasToShow.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = '<p>検索結果がありません。検索条件を変更してください。</p>';
            this.elements.formulaGrid.appendChild(noResults);
            return;
        }

        formulasToShow.forEach(formula => {
            const formulaCard = this.createFormulaCard(formula);
            this.elements.formulaGrid.appendChild(formulaCard);
        });
    }

    /**
     * 数式タイプを表示
     */
    renderFormulaTypes() {
        this.elements.formulaTypeContainer.innerHTML = '';

        const allFormulaTypes = this.dataService.getAllFormulaTypes();
        const selectedFormulaTypes = this.searchController.getSelectedFormulaTypes();

        allFormulaTypes.forEach(type => {
            const typeElement = document.createElement('div');
            typeElement.className = 'formula-type-tag';
            typeElement.textContent = type;

            if (selectedFormulaTypes.includes(type)) {
                typeElement.classList.add('selected');
            }

            typeElement.addEventListener('click', () => {
                this.searchController.toggleFormulaType(type);
                this.renderFormulaTypes();

                // 検索結果を即時更新するための追加コード
                const filteredFormulas = this.searchController.getFilteredFormulas();
                const paginationController = window.app.paginationController;
                const startIndex = paginationController.getStartIndex();
                const endIndex = paginationController.getEndIndex();
                this.renderFormulas(filteredFormulas, startIndex, endIndex);
                paginationController.updatePagination();
            });

            this.elements.formulaTypeContainer.appendChild(typeElement);
        });
    }

    /**
     * 数式カードを作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} 数式カード要素
     */
    createFormulaCard(formula) {
        const card = document.createElement('div');
        card.className = 'formula-card';

        // 左側の画像と数式タイプのセクションを追加
        card.appendChild(this._createImageSection(formula));
        
        // 右側の情報コンテナを追加
        card.appendChild(this._createFormulaInfoSection(formula));
        
        // カード全体にクリックイベントを追加
        card.addEventListener('click', (event) => {
            // コピーボタンがクリックされた場合はモーダルを開かない
            if (event.target.closest('.copy-button')) {
                return;
            }
            this.openFormulaModal(formula);
        });

        return card;
    }

    /**
     * 数式モーダルを開く
     * @param {Formula} formula - 表示する数式オブジェクト
     * @param {boolean} [isInitialLoad=false] - 初期ロードかどうか
     */
    openFormulaModal(formula, isInitialLoad = false) {
        // モーダル内容をクリア
        this.elements.modalContent.innerHTML = '';
        
        // モーダルタイトル
        const title = document.createElement('h2');
        title.className = 'modal-formula-title';
        title.textContent = formula.title || `数式 ${formula.id}`;
        this.elements.modalContent.appendChild(title);
        
        // 数式画像セクション
        const imageSection = this._createModalImageSection(formula);
        this.elements.modalContent.appendChild(imageSection);
        
        // 数式コンテンツセクション
        const formulaContent = this._createModalFormulaContent(formula);
        this.elements.modalContent.appendChild(formulaContent);
        
        // タグとIDセクション
        const tagIdSection = this._createModalTagsAndIdSection(formula);
        this.elements.modalContent.appendChild(tagIdSection);
        
        // 報告ボタン（アイコン）
        const reportButton = document.createElement('button');
        reportButton.className = 'report-icon';
        reportButton.innerHTML = '<i class="fas fa-flag"></i>';
        reportButton.title = '報告';
        reportButton.addEventListener('click', (e) => {
            e.stopPropagation(); // モーダルが閉じないように
            this.reportRegister.openReportModal(formula);
        });
        imageSection.appendChild(reportButton);

        // モーダルを表示
        this.elements.formulaModal.classList.remove('hidden');
        
        // スクロールを無効化
        document.body.style.overflow = 'hidden';

        // URLパラメータを更新
        if (!isInitialLoad) {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('formulaId', formula.id);
            window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        }
    }
    
    /**
     * 数式モーダルを閉じる
     */
    closeModal() {
        this.elements.formulaModal.classList.add('hidden');
        
        // スクロールを有効化
        document.body.style.overflow = '';

        // URLパラメータを更新
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('formulaId');
        window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    }
    
    /**
     * モーダル用の画像セクションを作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} 画像セクション要素
     * @private
     */
    _createModalImageSection(formula) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'modal-formula-image';
        
        const img = document.createElement('img');
        img.src = formula.getImageUrl();
        img.alt = formula.title || `数式 ID: ${formula.id}`;
        
        // 数式タイプを画像の右上に表示
        const typeContainer = document.createElement('div');
        typeContainer.className = 'modal-image-type-container';
        
        // カンマで区切られた数式タイプを分割
        const types = formula.formulaType.split(',').map(type => type.trim());
        types.forEach(type => {
            if (!type) return;
            
            const typeTag = document.createElement('span');
            typeTag.className = 'modal-image-type-tag';
            typeTag.textContent = type;
            
            typeContainer.appendChild(typeTag);
        });
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(typeContainer);
        
        return imageContainer;
    }
    
    /**
     * モーダル用の数式コンテンツを作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} 数式コンテンツ要素
     * @private
     */
    _createModalFormulaContent(formula) {
        // 数式コンテナ（スクロール可能な領域）
        const formulaScrollContainer = document.createElement('div');
        formulaScrollContainer.className = 'modal-formula-scroll-container';
        
        // 数式テキスト
        const formulaText = document.createElement('div');
        formulaText.className = 'modal-formula-text';
        formulaText.textContent = formula.formula;
        
        formulaScrollContainer.appendChild(formulaText);
        
        // コピーボタンコンテナ
        const copyButtonContainer = document.createElement('div');
        copyButtonContainer.className = 'modal-copy-button-container';
        
        // モーダル用のコピーボタン
        const copyButton = document.createElement('button');
        copyButton.className = 'modal-copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '数式をコピー';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation(); // モーダルが閉じないように
            this._copyFormulaToClipboard(formula.formula, copyButton);
        });
        
        copyButtonContainer.appendChild(copyButton);
        
        // 数式コンテナ
        const formulaContainer = document.createElement('div');
        formulaContainer.className = 'modal-formula-content';
        formulaContainer.appendChild(formulaScrollContainer);
        formulaContainer.appendChild(copyButtonContainer);
        
        return formulaContainer;
    }
    
    /**
     * モーダル用のタグとIDセクションを作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} タグとIDセクション要素
     * @private
     */
    _createModalTagsAndIdSection(formula) {
        const container = document.createElement('div');
        container.className = 'modal-tag-id-container';
        
        // タグコンテナ
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'modal-formula-tags';
        
        formula.tags.forEach(tag => {
            if (!tag) return;
            
            const tagElement = document.createElement('div');
            tagElement.className = 'modal-formula-tag';
            tagElement.textContent = tag;
            
            tagElement.addEventListener('click', (e) => {
                e.stopPropagation(); // モーダルが閉じないように
                this._handleTagClick(tag);
                this.closeModal(); // タグ選択後はモーダルを閉じる
            });
            
            tagsContainer.appendChild(tagElement);
        });
        
        // ID表示
        const idElement = document.createElement('div');
        idElement.className = 'modal-formula-id';
        idElement.textContent = `ID: ${formula.id}`;
        
        container.appendChild(tagsContainer);
        container.appendChild(idElement);
        
        return container;
    }

    /**
     * 数式カードの画像セクションを作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} 画像セクション要素
     * @private
     */
    _createImageSection(formula) {
        // 左側の画像コンテナ
        const imageContainer = document.createElement('div');
        imageContainer.className = 'formula-image';

        const img = document.createElement('img');
        img.src = formula.getImageUrl();
        img.alt = formula.title || `数式 ID: ${formula.id}`;

        // 数式タイプを画像の右上に表示
        const imageTypeContainer = document.createElement('div');
        imageTypeContainer.className = 'image-type-container';

        // カンマで区切られた数式タイプを分割
        const types = formula.formulaType.split(',').map(type => type.trim());
        types.forEach(type => {
            if (!type) return;

            const typeTag = document.createElement('span');
            typeTag.className = 'image-type-tag';
            typeTag.textContent = type;

            imageTypeContainer.appendChild(typeTag);
        });

        imageContainer.appendChild(img);
        imageContainer.appendChild(imageTypeContainer);

        return imageContainer;
    }

    /**
     * 数式カードの情報セクションを作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} 情報セクション要素
     * @private
     */
    _createFormulaInfoSection(formula) {
        // 右側の情報コンテナ
        const infoContainer = document.createElement('div');
        infoContainer.className = 'formula-info';

        // タイトル
        const title = document.createElement('h3');
        title.className = 'formula-title';
        title.textContent = formula.title || `数式 ${formula.id}`;

        // 数式コンテンツ領域の作成
        const formulaContainer = this._createFormulaContent(formula);

        // タグとID情報の作成
        const tagIdContainer = this._createTagsAndIdSection(formula);

        // 情報コンテナに要素を追加
        infoContainer.appendChild(title);
        infoContainer.appendChild(formulaContainer);
        infoContainer.appendChild(tagIdContainer);

        return infoContainer;
    }

    /**
     * 数式のコンテンツ部分（式とコピーボタン）を作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} 数式コンテンツ要素
     * @private
     */
    _createFormulaContent(formula) {
        // 数式コンテナ（スクロール可能な領域）
        const formulaScrollContainer = document.createElement('div');
        formulaScrollContainer.className = 'formula-scroll-container';

        // 数式テキスト
        const formulaText = document.createElement('div');
        formulaText.className = 'formula-text';
        formulaText.textContent = formula.formula;

        formulaScrollContainer.appendChild(formulaText);

        // コピーボタンコンテナ（スクロール領域の外）
        const copyButtonContainer = document.createElement('div');
        copyButtonContainer.className = 'copy-button-container';

        // コピーボタン
        copyButtonContainer.appendChild(this._createCopyButton(formula.formula));

        // 数式コンテナ（スクロール領域とコピーボタンを含む）
        const formulaContainer = document.createElement('div');
        formulaContainer.className = 'formula-content';
        formulaContainer.appendChild(formulaScrollContainer);
        formulaContainer.appendChild(copyButtonContainer);

        return formulaContainer;
    }

    /**
     * 数式をコピーするためのボタンを作成
     * @param {string} formulaText - コピーする数式テキスト
     * @returns {HTMLElement} コピーボタン要素
     * @private
     */
    _createCopyButton(formulaText) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '数式をコピー';
        copyButton.addEventListener('click', () => this._copyFormulaToClipboard(formulaText, copyButton));
        return copyButton;
    }

    /**
     * 数式をクリップボードにコピー
     * @param {string} formulaText - コピーする数式テキスト
     * @param {HTMLElement} button - コピーボタン要素（フィードバックの表示用）
     * @private
     */
    _copyFormulaToClipboard(formulaText, button) {
        navigator.clipboard.writeText(formulaText)
            .then(() => {
                // コピー成功時の処理
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            })
            .catch(err => {
                console.error('数式のコピーに失敗しました:', err);
            });
    }

    /**
     * タグとIDのセクションを作成
     * @param {Formula} formula - 数式オブジェクト
     * @returns {HTMLElement} タグとID表示セクション
     * @private
     */
    _createTagsAndIdSection(formula) {
        // タグとIDのコンテナ
        const tagIdContainer = document.createElement('div');
        tagIdContainer.className = 'tag-id-container';

        // タグ
        const tags = document.createElement('div');
        tags.className = 'formula-tags';

        formula.tags.forEach(tag => {
            if (!tag) return;

            const tagElement = document.createElement('div');
            tagElement.className = 'formula-tag';
            tagElement.textContent = tag;

            tagElement.addEventListener('click', () => this._handleTagClick(tag));

            tags.appendChild(tagElement);
        });

        // ID（右下に小さく表示）
        const idElement = document.createElement('div');
        idElement.className = 'formula-id-small';
        idElement.textContent = `ID: ${formula.id}`;

        // タグとIDをコンテナに追加
        tagIdContainer.appendChild(tags);
        tagIdContainer.appendChild(idElement);

        return tagIdContainer;
    }

    /**
     * 数式カードのタグをクリックした時の処理
     * @param {string} tag - クリックされたタグ
     * @private
     */
    _handleTagClick(tag) {
        if (!this.searchController.getSelectedTags().includes(tag)) {
            this.searchController.toggleTag(tag);
            this.renderTags();

            // 検索結果を即時更新
            const filteredFormulas = this.searchController.getFilteredFormulas();
            const paginationController = window.app.paginationController;
            const startIndex = paginationController.getStartIndex();
            const endIndex = paginationController.getEndIndex();
            this.renderFormulas(filteredFormulas, startIndex, endIndex);
            paginationController.updatePagination();
        }
    }

    /**
     * ローディング表示の切り替え
     * @param {boolean} isLoading - ローディング中かどうか
     */
    toggleLoading(isLoading) {
        if (isLoading) {
            this.elements.loading.classList.remove('hidden');
        } else {
            this.elements.loading.classList.add('hidden');
        }
    }
}