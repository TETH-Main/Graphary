/**
 * UI表示と操作を担当するコントローラークラス
 */
class UIController {
    /**
     * UIControllerのコンストラクタ
     * @param {DataService} dataService - データサービス
     * @param {SearchController} searchController - 検索コントローラー
     */
    constructor(dataService, searchController) {
        this.dataService = dataService;
        this.searchController = searchController;

        // DOM要素
        this.elements = {
            keywordSearch: document.getElementById('keyword-search'),
            tagContainer: document.getElementById('tag-container'),
            formulaTypeContainer: document.getElementById('formula-type-container'), // 追加
            formulaGrid: document.getElementById('formula-grid'),
            loading: document.getElementById('loading'),
            tagCloud: document.getElementById('tag-cloud'),
            sortSelect: document.getElementById('sort-select'),
        };
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

        // 右側の情報コンテナ
        const infoContainer = document.createElement('div');
        infoContainer.className = 'formula-info';

        // タイトル
        const title = document.createElement('h3');
        title.className = 'formula-title';
        title.textContent = formula.title || `数式 ${formula.id}`;

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
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '数式をコピー';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(formula.formula)
                .then(() => {
                    // コピー成功時の処理
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    console.error('数式のコピーに失敗しました:', err);
                });
        });

        copyButtonContainer.appendChild(copyButton);

        // 数式コンテナ（スクロール領域とコピーボタンを含む）
        const formulaContainer = document.createElement('div');
        formulaContainer.className = 'formula-content';
        formulaContainer.appendChild(formulaScrollContainer);
        formulaContainer.appendChild(copyButtonContainer);

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

            tagElement.addEventListener('click', () => {
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
            });

            tags.appendChild(tagElement);
        });

        // ID（右下に小さく表示）
        const idElement = document.createElement('div');
        idElement.className = 'formula-id-small';
        idElement.textContent = `ID: ${formula.id}`;

        // タグとIDをコンテナに追加
        tagIdContainer.appendChild(tags);
        tagIdContainer.appendChild(idElement);

        // 情報コンテナに要素を追加
        infoContainer.appendChild(title);
        infoContainer.appendChild(formulaContainer);
        infoContainer.appendChild(tagIdContainer);

        // カードに要素を追加
        card.appendChild(imageContainer);
        card.appendChild(infoContainer);

        return card;
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