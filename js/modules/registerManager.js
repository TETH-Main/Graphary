export class RegisterManager {
    constructor() {
        this.elements = {
            registerModal: document.getElementById('register-modal'),
            registerFab: document.getElementById('register-fab'),
            modalClose: document.getElementById('register-modal-close'),
            modalOverlay: document.getElementById('register-modal').querySelector('.modal-overlay'),
            // Desmos関連の要素を追加
            desmosContainer: document.getElementById('desmos-calculator'),
            calculator2D: document.getElementById('calculator'),
            calculator3D: document.getElementById('calculator-3d'),
            versionRadios: document.querySelectorAll('input[name="version"]'),
            labelSizeSelect: document.querySelector('select[name="labelSize"]'),
            screenshotButton: document.getElementById('screenshot-button'),
            preview: document.getElementById('preview'),
            // フォーミュラタイプチェックボックス
            typeCheckboxes: document.querySelectorAll('input[name="formula_type"]'),
            // タグ関連の要素
            selectedTagsContainer: document.getElementById('selected-tags-container'),
            tagSearchInput: document.getElementById('tag-search'),
            tagSuggestionsList: document.getElementById('tag-suggestions-list'),
            addNewTagButton: document.getElementById('add-new-tag'),
            createNewTagContainer: document.getElementById('create-new-tag-container'),
            newTagNameDisplay: document.getElementById('new-tag-name'),
            // フォーム関連の要素
            form: document.getElementById('formula-register-form'),
            titleInput: document.getElementById('formula-title'),
            tagsHiddenInput: document.getElementById('formula-tags'), // Renamed for clarity
            latexInput: document.getElementById('formula-latex'),
            registerButton: document.getElementById('register-button'),
            registerStatus: document.getElementById('register-status'),
            statusMessage: document.getElementById('register-status').querySelector('.status-message'),
            registerResult: document.getElementById('register-result'),
            resultSuccessIcon: document.getElementById('register-result').querySelector('.result-icon.success'),
            resultErrorIcon: document.getElementById('register-result').querySelector('.result-icon.error'),
            resultSuccessMessage: document.getElementById('register-result').querySelector('.result-message.success-message'),
            resultErrorMessage: document.getElementById('register-result').querySelector('.result-message.error-message')
        };

        // タグ関連のデータ
        this.tagsData = {
            allTags: [], // 全てのタグデータ {id, name, name_EN}
            selectedTags: [], // 選択されたタグ {id, name, name_EN} の配列
            filteredTags: [], // 検索でフィルタリングされたタグ
            isCreatingNewTag: false // 新規タグ作成モードかどうか
        };

        // Desmosインスタンス
        this.desmosCalculator = null;
        this.desmos3D = null;
        this.calculatorLabelScreenshot = null;

        // 言語マネージャーへの参照
        this.languageManager = null;

        // Google Apps Script URL & Imgur Client ID
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbzoaggjalkJVY0NbVjntDxxm3PWGpgdcieTczTXVrPWmx5lz7KquGptmY_qSjK0XGIu/exec'; // Use the correct GAS URL
        this.imgurClientId = 'fb9268d8cb1290a'; // Your Imgur Client ID

        this.initialized = false;
        this.init();
    }

    /**
     * 言語マネージャーを設定
     * @param {Object} languageManager - 言語マネージャーのインスタンス
     */
    setLanguageManager(languageManager) {
        this.languageManager = languageManager;
        
        // 言語マネージャーのオブザーバーとして登録
        if (this.languageManager) {
            this.languageManager.addObserver({
                updateLanguage: (lang) => {
                    this.updateLanguage(lang);
                }
            });
        }
    }

    /**
     * 言語が変更されたときにUIを更新する
     * @param {string} lang - 言語コード ('jp' または 'en')
     */
    updateLanguage(lang) {
        // タグ関連のテキストを更新
        this.elements.tagSearchInput.placeholder = this.getTranslation('search-tags-placeholder');
        this.elements.addNewTagButton.querySelector('span').textContent = this.getTranslation('create-new-tag');
        this.elements.tagSuggestionsList.previousElementSibling.querySelector('.tag-suggestions-title').textContent = this.getTranslation('available-tags');
        this.elements.newTagNameDisplay.textContent = this.elements.tagSearchInput.value.trim();

        // 数式入力関連のテキストを更新
        document.querySelector('label[for="formula-title"]').textContent = `${this.getTranslation('title')} *`;
        document.querySelector('label[for="formula-tags"]').textContent = `${this.getTranslation('tags')} *`;
        document.querySelector('label[data-translate="formula-input"]').textContent = `${this.getTranslation('formula-input')} *`;

        // タグ候補と選択済みタグを再描画
        this.sortTags();
        this.renderSelectedTags();
        this.filterAndRenderTagSuggestions();

        // 新規タグ作成メッセージの更新（表示中の場合）
        if (this.tagsData.isCreatingNewTag && this.elements.tagSearchInput.value.trim()) {
            this.updateCreateNewTagMessage(this.elements.tagSearchInput.value.trim());
        }

        this.elements.registerButton.innerHTML = `<i class="fas fa-upload"></i> ${this.getTranslation('register-button')}`;
        this.elements.statusMessage.textContent = this.getTranslation('processing-message');
        this.elements.resultSuccessMessage.textContent = this.getTranslation('result-message-success');
        // Error message might need parameter replacement, handle in showResult
        // this.elements.resultErrorMessage.textContent = this.getTranslation('result-message-error');

        // Update tag suggestions title and button text
        this.elements.tagSuggestionsList.previousElementSibling.querySelector('.tag-suggestions-title').textContent = this.getTranslation('available-tags');
        this.elements.addNewTagButton.querySelector('span').textContent = this.getTranslation('create-new-tag');

        // Update "Will create tag" message if visible
        if (this.tagsData.isCreatingNewTag && this.elements.tagSearchInput.value.trim()) {
            this.updateCreateNewTagMessage(this.elements.tagSearchInput.value.trim());
        }

        // Re-render tags
        this.sortTags();
        this.renderSelectedTags(); // Update selected tag text and remove button titles
        this.filterAndRenderTagSuggestions(); // Update suggestion text
    }

    init() {
        if (this.initialized) return;
        
        // FABボタンのクリックイベント
        this.elements.registerFab.addEventListener('click', () => this.showModal());

        // 閉じるボタンのクリックイベント
        this.elements.modalClose.addEventListener('click', () => this.hideModal());

        // オーバーレイクリックでモーダルを閉じる
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.hideModal();
            }
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.registerModal.classList.contains('hidden')) {
                this.hideModal();
            }
        });

        // Desmos関連の初期化
        this.initDesmosCalculators();
        this.setupDesmosEvents();
        
        // タグデータを取得
        this.fetchTagsData();
        
        // タグ関連のイベントリスナー設定
        this.setupTagEventListeners();

        // フォーム送信イベント
        this.elements.form.addEventListener('submit', (e) => {
            // Prevent submission if a Desmos button triggered it (heuristic)
            if (e.submitter && e.submitter.closest('.desmos-container')) {
                 e.preventDefault();
                 return;
            }
            e.preventDefault();
            this.handleFormSubmit();
        });

        // スクリーンショットボタンクリックイベント
        this.elements.screenshotButton.addEventListener('click', async () => {
            try {
                const screenshot = await this.getGraTeXScreenshot();
                this.elements.preview.src = screenshot;
                this.elements.preview.style.display = 'block';
            } catch (error) {
                console.error('Screenshot generation failed:', error);
                alert(this.getTranslation('alert-screenshot-fail'));
            }
        });

        this.initialized = true;
    }

    initDesmosCalculators() {
        // 2D Calculator
        this.desmosCalculator = Desmos.GraphingCalculator(this.elements.calculator2D);
        this.desmosCalculator.observeEvent('change', () => {
            this.updateLatexInput();
        });

        // Label Screenshot Calculator
        this.calculatorLabelScreenshot = Desmos.GraphingCalculator(document.createElement('div'), {
            showGrid: false,
            showXAxis: false,
            showYAxis: false
        });

        // 3D Calculator
        this.elements.calculator3D.style.display = 'none';
        this.elements.calculator3D.onload = () => {
            this.desmos3D = this.elements.calculator3D.contentWindow.Calc;
            // Observe changes in the 3D calculator
            this.desmos3D.observeEvent('change', () => {
                this.updateLatexInput();
            });
        };

        // 3秒後にボタンのtype属性を設定（Desmosの初期化を待つ）
        setTimeout(() => {
            const buttons = this.elements.desmosContainer.querySelectorAll('button');
            buttons.forEach(button => {
                button.type = 'button';
            });
        }, 3000);
    }

    setupDesmosEvents() {
        // 2D/3D切り替えイベント
        this.elements.versionRadios.forEach(radio => {
            radio.addEventListener('change', (event) => {
                const is2D = event.target.value === 'version-2d';
                this.elements.calculator2D.style.display = is2D ? '' : 'none';
                this.elements.calculator3D.style.display = is2D ? 'none' : '';

                // 3Dタイプのチェックボックスを自動制御
                const formulaType3DCheckbox = Array.from(this.elements.typeCheckboxes)
                    .find(checkbox => checkbox.value === '3D');
                if (formulaType3DCheckbox) {
                    formulaType3DCheckbox.checked = !is2D;
                }
            });
        });
    }

    showModal() {
        this.elements.registerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';  // スクロール無効化

        // モーダルを表示した時にDesmosを初期化
        if (this.desmosCalculator) {
            this.desmosCalculator.resize();
        }
        if (this.desmos3D) {
            this.desmos3D.resize();
        }
    }

    hideModal() {
        this.elements.registerModal.classList.add('hidden');
        document.body.style.overflow = '';  // スクロール有効化
        this.resetForm(); // Reset form when hiding modal
    }

    /**
     * タグ関連のイベントリスナーを設定
     */
    setupTagEventListeners() {
        // タグ検索入力イベント
        this.elements.tagSearchInput.addEventListener('input', () => {
            this.handleTagSearch();
        });

        // タグ検索のキーダウンイベント（Enterキーの処理）
        this.elements.tagSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleEnterKeyInTagSearch();
            }
        });

        // 新規タグ作成ボタン
        this.elements.addNewTagButton.addEventListener('click', () => {
            const searchText = this.elements.tagSearchInput.value.trim();
            if (searchText) {
                this.createNewTag(searchText);
            } else {
                // 検索テキストが空の場合はフォーカス
                this.elements.tagSearchInput.focus();
            }
        });
    }

    /**
     * タグデータを取得
     */
    async fetchTagsData() {
        try {
            const response = await fetch(`${this.scriptUrl}?id=139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM&name=tagsList`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tagsList = await response.json();
            
            if (tagsList && Array.isArray(tagsList)) {
                this.tagsData.allTags = tagsList.map(tag => ({
                    id: tag.tagID.toString(),
                    name: tag.tagName || '',
                    name_EN: tag.tagName_EN || ''
                }));
                
                // 言語に基づいてタグをソート
                this.sortTags();
                
                // タグ候補を表示
                this.filterAndRenderTagSuggestions();
            }
        } catch (error) {
            console.error('タグデータの取得に失敗しました:', error);
        }
    }

    /**
     * 現在の言語に基づいてタグをソート
     */
    sortTags() {
        const currentLang = this.languageManager ? 
            this.languageManager.getCurrentLanguage() : 'jp';
        
        this.tagsData.allTags.sort((a, b) => {
            const nameA = currentLang === 'en' && a.name_EN ? a.name_EN : a.name;
            const nameB = currentLang === 'en' && b.name_EN ? b.name_EN : b.name;
            return nameA.localeCompare(nameB);
        });
    }

    /**
     * タグ検索処理
     */
    handleTagSearch() {
        const searchText = this.elements.tagSearchInput.value.trim();
        
        if (searchText === '') {
            // 検索テキストが空の場合は全てのタグを表示（選択済みのものを除く）
            this.tagsData.isCreatingNewTag = false;
            this.elements.createNewTagContainer.classList.add('hidden');
            this.filterAndRenderTagSuggestions();
        } else {
            const lowerSearchText = searchText.toLowerCase();
            // 検索テキストでタグをフィルタリング
            const filteredTags = this.tagsData.allTags.filter(tag => 
                (tag.name.toLowerCase().includes(lowerSearchText) || 
                 (tag.name_EN && tag.name_EN.toLowerCase().includes(lowerSearchText))) && 
                !this.isTagSelected(tag.id)
            );
            
            // フィルタリングされたタグを表示
            this.tagsData.filteredTags = filteredTags;
            this.renderTagSuggestions(filteredTags);
            
            // 完全一致するタグがない場合、新規タグ作成の表示
            const exactMatch = filteredTags.some(tag => 
                tag.name.toLowerCase() === lowerSearchText || 
                (tag.name_EN && tag.name_EN.toLowerCase() === lowerSearchText)
            );
            
            if (!exactMatch) {
                // 新規タグ作成モードを有効化
                this.tagsData.isCreatingNewTag = true;
                this.updateCreateNewTagMessage(searchText);
                this.elements.createNewTagContainer.classList.remove('hidden');
            } else {
                this.tagsData.isCreatingNewTag = false;
                this.elements.createNewTagContainer.classList.add('hidden');
            }
        }
    }

    /**
     * 新規タグ作成メッセージを更新
     * @param {string} tagName - 新規タグの名前
     */
    updateCreateNewTagMessage(tagName) {
        const currentLang = this.languageManager ? 
            this.languageManager.getCurrentLanguage() : 'jp';
        
        let messageHTML;
        if (currentLang === 'en') {
            messageHTML = `Will create new tag "<span class="create-new-tag-name">${tagName}</span>"`;
        } else {
            messageHTML = `新しいタグ「<span class="create-new-tag-name">${tagName}</span>」を作成します。`;
        }
        
        this.elements.createNewTagContainer.innerHTML = messageHTML;
        // Update the reference to the new tag name span element
        this.elements.newTagNameDisplay = this.elements.createNewTagContainer.querySelector('.create-new-tag-name');
    }

    /**
     * タグ検索でEnterキーを押した時の処理
     */
    handleEnterKeyInTagSearch() {
        const searchText = this.elements.tagSearchInput.value.trim();
        
        if (!searchText) return;
        
        // フィルタリングされたタグが1つだけなら、それを選択
        if (this.tagsData.filteredTags.length === 1) {
            this.addTag(this.tagsData.filteredTags[0]);
        }
        // フィルタリングされたタグがなく、新規タグ作成モードなら新規タグを作成
        else if (this.tagsData.filteredTags.length === 0 && this.tagsData.isCreatingNewTag) {
            this.createNewTag(searchText);
        }
    }

    /**
     * 新規タグを作成
     * @param {string} tagName - 新規タグの名前
     */
    createNewTag(tagName) {
        // 新規タグのIDを生成
        const newTagId = `new_${Date.now()}`;
        
        // 新規タグを選択状態にする
        const newTag = {
            id: newTagId,
            name: tagName,
            name_EN: tagName, // 英語名は仮に同じにする
            isNew: true // 新規タグのフラグ
        };
        
        // 選択済みタグリストに追加
        this.addTag(newTag);
        
        // 新規タグをタグリストに追加（一時的）
        this.tagsData.allTags.push(newTag);
        
        // タグをGlobal tagsList for all components to use
        if (window.tagsList && Array.isArray(window.tagsList)) {
            window.tagsList.push({
                tagID: newTagId,
                tagName: tagName,
                tagName_EN: tagName
            });
        }
        
        // 新規タグ作成モードを解除
        this.tagsData.isCreatingNewTag = false;
        this.elements.createNewTagContainer.classList.add('hidden');
        
        // 検索フィールドをクリア
        this.elements.tagSearchInput.value = '';
    }

    /**
     * 翻訳テキストを取得
     * @param {string} key - 翻訳キー
     * @param {Object} params - プレースホルダー置換用のパラメータ
     * @returns {string} 翻訳されたテキスト
     */
    getTranslation(key, params = {}) {
        if (this.languageManager) {
            return this.languageManager.translate(key, params);
        }
        return key; // デフォルトでキーを返す
    }

    /**
     * タグ候補をフィルタリングして表示
     */
    filterAndRenderTagSuggestions() {
        // 選択されていないタグのみ表示
        const availableTags = this.tagsData.allTags.filter(tag => !this.isTagSelected(tag.id));
        this.renderTagSuggestions(availableTags);
    }

    /**
     * タグ候補を表示
     * @param {Array} tags - 表示するタグの配列
     */
    renderTagSuggestions(tags = []) {
        this.elements.tagSuggestionsList.innerHTML = '';
        
        if (tags.length === 0) {
            // タグがない場合はメッセージを表示
            const noTagsMessage = document.createElement('div');
            noTagsMessage.className = 'no-tags-message';
            noTagsMessage.textContent = this.getTranslation('register-no-tags');
            this.elements.tagSuggestionsList.appendChild(noTagsMessage);
            return;
        }
        
        // タグ候補要素を作成
        tags.forEach(tag => {
            const tagDiv = document.createElement('div');
            tagDiv.className = 'tag-suggestion';
            tagDiv.setAttribute('data-translate-tag', tag.name);
            tagDiv.setAttribute('data-tag-name-en', tag.name_EN);
            tagDiv.textContent = this.getLocalizedTagName(tag);
            
            // クリックイベントでタグを追加
            tagDiv.addEventListener('click', () => {
                this.addTag(tag);
            });
            
            this.elements.tagSuggestionsList.appendChild(tagDiv);
        });
    }

    /**
     * タグの言語に応じた名前を取得
     * @param {Object} tag - タグオブジェクト
     * @returns {string} タグ名
     */
    getLocalizedTagName(tag) {
        const currentLang = this.languageManager ? 
            this.languageManager.getCurrentLanguage() : 'jp';
        return currentLang === 'en' && tag.name_EN ? tag.name_EN : tag.name;
    }

    /**
     * 翻訳テキストを取得
     * @param {string} key - 翻訳キー
     * @returns {string} 翻訳されたテキスト
     */
    getTranslation(key) {
        if (this.languageManager) {
            return this.languageManager.translate(key);
        }
        return key; // デフォルトでキーを返す
    }

    /**
     * タグが選択されているか確認
     * @param {string} tagId - タグID
     * @returns {boolean} 選択されていればtrue
     */
    isTagSelected(tagId) {
        return this.tagsData.selectedTags.some(tag => tag.id === tagId);
    }

    /**
     * タグを追加
     * @param {Object} tag - タグデータ {id, name, name_EN}
     */
    addTag(tag) {
        // すでに選択されていれば何もしない
        if (this.isTagSelected(tag.id)) return;
        
        // 選択されたタグリストに追加
        this.tagsData.selectedTags.push(tag);
        
        // 選択済みタグを再描画
        this.renderSelectedTags();
        
        // 検索フィールドをクリアしてフォーカス
        this.elements.tagSearchInput.value = '';
        this.elements.tagSearchInput.focus();
        
        // タグ候補を再フィルタリング
        this.filterAndRenderTagSuggestions();
    }

    /**
     * タグを削除
     * @param {string} tagId - 削除するタグのID
     */
    removeTag(tagId) {
        // 選択されたタグリストから削除
        this.tagsData.selectedTags = this.tagsData.selectedTags.filter(tag => tag.id !== tagId);
        
        // 選択済みタグを再描画
        this.renderSelectedTags();
        
        // タグ候補を再フィルタリング
        this.filterAndRenderTagSuggestions();
    }

    /**
     * 選択されたタグを描画
     */
    renderSelectedTags() {
        this.elements.selectedTagsContainer.innerHTML = '';
        
        this.tagsData.selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'selected-tag';
            
            // タグテキスト
            const tagText = document.createElement('span');
            tagText.className = 'selected-tag-text';
            tagText.textContent = this.getLocalizedTagName(tag);
            
            // 削除ボタン
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'selected-tag-remove';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.title = this.getTranslation('register-remove-tag');
            
            // 削除ボタンのクリックイベント
            removeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.removeTag(tag.id);
            });
            
            tagElement.appendChild(tagText);
            tagElement.appendChild(removeButton);
            this.elements.selectedTagsContainer.appendChild(tagElement);
        });
        
        // 隠しフィールドの値も更新
        document.getElementById('formula-tags').value = this.tagsData.selectedTags
            .map(tag => tag.id).join(',');
    }

    /**
     * Updates the hidden LaTeX input based on the active calculator.
     */
    updateLatexInput() {
        const is2D = this.elements.versionRadios[0].checked; // Check if 2D radio is selected
        if (is2D && this.desmosCalculator) {
            this.elements.latexInput.value = this.getDesmosFormula();
        } else if (!is2D && this.desmos3D) {
            this.elements.latexInput.value = this.getDesmosFormula3D();
        } else {
            this.elements.latexInput.value = '';
        }
    }

    /**
     * フォーム送信処理
     */
    async handleFormSubmit() {
        try {
            // バリデーション
            if (!this.validateForm()) {
                return;
            }

            // 送信中の状態を表示
            this.showStatus(this.getTranslation('processing-message'));

            // フォームデータを取得
            const formulaData = this.getFormData();

            // Desmosからスクリーンショットを取得 (Base64)
            const screenshotBase64 = this.getScreenshotData();
            if (!screenshotBase64) {
                 throw new Error(this.getTranslation('alert-screenshot-required'));
            }

            // Imgurに画像をアップロード
            const imageUrl = await this.uploadToImgur(screenshotBase64);

            // Google Apps Scriptに送信
            const result = await this.sendToGoogleAppsScript({
                ...formulaData,
                image_url: imageUrl // Use the Imgur URL hash
            }, 'formula'); // Specify 'formula' type

            // 成功メッセージを表示
            this.showResult(true, this.getTranslation('result-message-success'));

            // 5秒後にフォームをリセット (Optional: Keep form open on success?)
            setTimeout(() => {
                this.resetForm(); // Reset form after hiding modal
            }, 5000);

        } catch (error) {
            console.error('Form submission error:', error);
            this.showResult(false, `${this.getTranslation('result-message-error')} ${error.message}`);
        }
    }

    /**
     * フォームのバリデーション
     * @returns {boolean} バリデーション結果
     */
    validateForm() {
        // タイトル
        if (!this.elements.titleInput.value.trim()) {
            alert(this.getTranslation('alert-title-required'));
            this.elements.titleInput.focus();
            return false;
        }

        // 数式タイプ
        const selectedTypes = Array.from(this.elements.typeCheckboxes)
            .filter(checkbox => checkbox.checked);
        if (selectedTypes.length === 0) {
            alert(this.getTranslation('alert-type-required'));
            return false;
        }

        // タグ
        if (this.tagsData.selectedTags.length === 0) {
            alert(this.getTranslation('alert-tags-required'));
            this.elements.tagSearchInput.focus();
            return false;
        }

        // LaTeX数式 (hidden input)
        if (!this.elements.latexInput.value.trim()) {
            alert(this.getTranslation('alert-formula-required'));
            // Focus might not be useful for hidden input, maybe focus Desmos?
            return false;
        }

        // スクリーンショットプレビュー
        if (!this.getScreenshotData()) {
            alert(this.getTranslation('alert-screenshot-required'));
            return false;
        }

        return true;
    }

    /**
     * フォームデータを取得
     * @returns {Object} フォームデータ
     */
    getFormData() {
        const title = this.elements.titleInput.value.trim();
        const formulaType = Array.from(this.elements.typeCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value)
            .join(', '); // Join with comma and space

        // Separate existing and new tags
        const existingTagIds = this.tagsData.selectedTags
            .filter(tag => !tag.isNew)
            .map(tag => tag.id)
            .join(','); // Comma-separated IDs

        const newTags = this.tagsData.selectedTags
            .filter(tag => tag.isNew)
            .map(tag => tag.name) // Send names of new tags
            .join(','); // Comma-separated names

        const formula = this.elements.latexInput.value.trim();

        return {
            title,
            formula_type: formulaType,
            tags: existingTagIds, // Existing tag IDs
            newTags: newTags,     // New tag names
            formula
        };
    }

    /**
     * Desmosグラフ計算機の数式を取得 (2D)
     * @returns {string} LaTeX形式の数式
     */
    getDesmosFormula() {
        if (!this.desmosCalculator) return '';
        const expressions = this.desmosCalculator.getExpressions();
        // Find the first expression with latex, adjust if needed
        const exp = expressions.find(exp => exp.latex);
        return exp ? exp.latex : '';
    }

    /**
     * 3D Desmosグラフ計算機の数式を取得
     * @returns {string} LaTeX形式の数式
     */
    getDesmosFormula3D() {
        if (!this.desmos3D) return '';
        const expressions = this.desmos3D.getExpressions();
        // Find the first expression with latex, adjust if needed
        const exp = expressions.find(exp => exp.latex);
        return exp ? exp.latex : '';
    }

    /**
     * スクリーンショットのBase64形式の画像データを取得
     * @returns {string | null} Base64形式の画像データ or null
     */
    getScreenshotData() {
        // Check if preview has a source and it's a data URL
        if (this.elements.preview.src && this.elements.preview.src.startsWith('data:image')) {
            return this.elements.preview.src;
        }
        return null;
    }

    /**
     * Desmosからスクリーンショットを取得 (GraTeX style)
     * @returns {Promise<string>} Base64形式の画像データ
     */
    async getGraTeXScreenshot() {
        const screenshotParam = {
            width: 1920,
            height: 1080,
            graphSize: 640,
            graphMargin: 96,
            labelPos: 720,
            labelSize: this.elements.labelSizeSelect.value,
            fillColor: '#ffffff'
        };
        const is2D = this.elements.versionRadios[0].checked; // Check if 2D radio is selected

        return new Promise((resolve, reject) => {
            const graphImg = new Image();
            const mergeImg = new Image();
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = screenshotParam.width;
            canvas.height = screenshotParam.height;

            // Ensure both images load before drawing
            Promise.all([
                new Promise(res => { graphImg.onload = res; graphImg.onerror = reject; }),
                new Promise(res => { mergeImg.onload = res; mergeImg.onerror = reject; })
            ]).then(() => {
                context.fillStyle = screenshotParam.fillColor;
                context.fillRect(0, 0, screenshotParam.width, screenshotParam.height);

                const graphWidth = screenshotParam.graphSize;
                const graphLeft = (screenshotParam.width - graphWidth) / 2; // Use / 2 instead of >> 1 for clarity
                context.drawImage(
                    graphImg, graphLeft,
                    screenshotParam.graphMargin,
                    graphWidth, screenshotParam.graphSize
                );
                context.strokeRect(
                    graphLeft,
                    screenshotParam.graphMargin,
                    graphWidth, screenshotParam.graphSize
                );

                context.globalCompositeOperation = 'multiply';
                context.drawImage(mergeImg, 0, 0, screenshotParam.width, screenshotParam.height);

                const base64Image = canvas.toDataURL('image/png'); // Specify PNG format
                resolve(base64Image);
            }).catch(error => {
                console.error("Error loading screenshot images:", error);
                reject(new Error(this.getTranslation('alert-screenshot-fail')));
            });

            // Select the correct calculator instance
            const calculator = is2D ? this.desmosCalculator : this.desmos3D;
            if (!calculator) {
                return reject(new Error("Calculator not initialized"));
            }

            // Generate graph screenshot
            try {
                graphImg.src = calculator.screenshot({
                    width: 320,
                    height: 320,
                    targetPixelRatio: screenshotParam.graphSize / 320
                });
            } catch (e) {
                 return reject(new Error(`Failed to get graph screenshot: ${e.message}`));
            }


            // Generate label screenshot
            const label = is2D ? this.getDesmosFormula() : this.getDesmosFormula3D();
            const ratio = (Math.min(screenshotParam.width, screenshotParam.height) >= 360) ? 2 : 1; // Simplified ratio calculation

            if (!this.calculatorLabelScreenshot) {
                 return reject(new Error("Label screenshot calculator not initialized"));
            }

            try {
                this.calculatorLabelScreenshot.setExpression({
                    id: 'label',
                    latex: `\\left(0,-${screenshotParam.labelPos / ratio}\\right)`,
                    color: 'black',
                    label: `\`${label}\``, // Use backticks for literal display in Desmos label
                    hidden: true,
                    showLabel: true,
                    secret: true, // Keep secret if needed
                    labelSize: `${screenshotParam.labelSize * screenshotParam.labelPos} / (${720 * ratio})` // Use string division for Desmos
                });

                this.calculatorLabelScreenshot.asyncScreenshot(
                    {
                        showLabels: true,
                        width: screenshotParam.width / ratio,
                        height: screenshotParam.height / ratio,
                        targetPixelRatio: ratio,
                        mathBounds: {
                            left: -screenshotParam.width / ratio,
                            right: screenshotParam.width / ratio,
                            bottom: -screenshotParam.height, // Adjust bounds as needed
                            top: screenshotParam.height
                        }
                    },
                    (s) => { mergeImg.src = s; } // Assign source in callback
                );
            } catch (e) {
                 return reject(new Error(`Failed to get label screenshot: ${e.message}`));
            }
        });
    }

    /**
     * Imgurに画像をアップロード
     * @param {string} base64Image - Base64形式の画像データ
     * @returns {Promise<string>} Imgurの画像URL (e.g., https://i.imgur.com/hash.png)
     */
    async uploadToImgur(base64Image) {
        const imageData = base64Image.split(',')[1]; // Remove data URL prefix

        try {
            const response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Client-ID ${this.imgurClientId}`,
                    'Content-Type': 'application/json' // Correct content type for JSON body
                },
                body: JSON.stringify({
                    image: imageData,
                    type: 'base64'
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error('Imgur API Error:', result.data);
                throw new Error(result.data?.error || this.getTranslation('alert-imgur-upload-fail'));
            }

            // Return the direct image link (HTTPS)
            return result.data.link;

        } catch (error) {
            console.error('Imgur upload fetch error:', error);
            // Rethrow a more specific error or the generic one
            throw new Error(error.message || this.getTranslation('alert-imgur-upload-fail'));
        }
    }

    /**
     * Google Apps Scriptに送信
     * @param {Object} data - 送信データ
     * @param {string} type - データの種類（'formula'）
     * @returns {Promise<Object>} レスポンス (Note: no-cors limits response reading)
     */
    async sendToGoogleAppsScript(data, type) {
        console.log('Sending data to GAS:', { ...data, type }); // Log data being sent
        try {
            // Using POST with 'no-cors' as required by GAS web apps for cross-origin requests
            // when not using JSONP. We won't be able to read the response directly.
            // We assume success if the fetch call itself doesn't throw an error (e.g., network error).
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // IMPORTANT for GAS web app POST from different origin
                cache: 'no-cache',
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                // Body needs to be stringified, but Content-Type header is omitted in 'no-cors' requests by browser
                // GAS needs to be set up to handle plain text POST body containing JSON string.
                // Alternatively, use GET with parameters if data size allows.
                // For POST, GAS `doPost(e)` receives data in `e.postData.contents`.
                body: JSON.stringify({ ...data, type }) // Send data as JSON string in body
            });

            // 'no-cors' means we get an opaque response. We can't check response.ok or read the body.
            // We assume success if the fetch call itself doesn't throw an error (e.g., network error).
            console.log('GAS request sent (opaque response due to no-cors).');
            return { success: true }; // Assume success

        } catch (error) {
            console.error('Google Apps Script send error:', error);
            throw new Error(this.getTranslation('alert-gas-send-fail'));
        }
    }

    /**
     * 処理状態を表示
     * @param {string} message - 表示するメッセージ
     */
    showStatus(message) {
        this.elements.registerStatus.classList.remove('hidden');
        this.elements.statusMessage.textContent = message; // Update message text
        this.elements.registerResult.classList.add('hidden');
        this.elements.registerButton.disabled = true; // Disable button during processing
    }

    /**
     * 処理結果を表示
     * @param {boolean} success - 成功したかどうか
     * @param {string} message - 表示するメッセージ
     */
    showResult(success, message) {
        this.elements.registerStatus.classList.add('hidden');
        this.elements.registerResult.classList.remove('hidden');
        this.elements.registerButton.disabled = false; // Re-enable button

        if (success) {
            this.elements.resultSuccessIcon.classList.remove('hidden');
            this.elements.resultErrorIcon.classList.add('hidden');
            this.elements.resultSuccessMessage.textContent = message;
            this.elements.resultSuccessMessage.classList.remove('hidden');
            this.elements.resultErrorMessage.classList.add('hidden');
            this.elements.registerResult.style.backgroundColor = '#e8f5e9'; // Light green
        } else {
            this.elements.resultSuccessIcon.classList.add('hidden');
            this.elements.resultErrorIcon.classList.remove('hidden');
            this.elements.resultErrorMessage.textContent = message; // Display error message
            this.elements.resultErrorMessage.classList.remove('hidden');
            this.elements.resultSuccessMessage.classList.add('hidden');
            this.elements.registerResult.style.backgroundColor = '#ffebee'; // Light red
        }

        // Optional: Hide result message after a delay
        /*
        setTimeout(() => {
            this.elements.registerResult.classList.add('hidden');
        }, 5000); // Hide after 5 seconds
        */
    }

    /**
     * フォームをリセット
     */
    resetForm() {
        this.elements.form.reset(); // Resets standard form inputs

        // Clear Desmos calculators
        if (this.desmosCalculator) {
            this.desmosCalculator.setBlank();
        }
        if (this.desmos3D) {
            // Assuming setBlank exists or similar method for 3D
             try { this.desmos3D.setBlank(); } catch(e) { console.warn("Could not reset 3D calc"); }
        }

        // Hide preview
        this.elements.preview.style.display = 'none';
        this.elements.preview.src = ''; // Clear preview source

        // Clear selected tags data and UI
        this.tagsData.selectedTags = [];
        this.renderSelectedTags(); // Update UI for selected tags
        this.filterAndRenderTagSuggestions(); // Update available tags

        // Clear hidden inputs
        this.elements.tagsHiddenInput.value = '';
        this.elements.latexInput.value = '';

        // Reset tag search state
        this.elements.tagSearchInput.value = '';
        this.tagsData.isCreatingNewTag = false;
        this.elements.createNewTagContainer.classList.add('hidden');

        // Hide status/result messages
        this.elements.registerStatus.classList.add('hidden');
        this.elements.registerResult.classList.add('hidden');

        // Ensure 2D is selected by default (or based on your preference)
        this.elements.versionRadios[0].checked = true;
        this.elements.calculator2D.style.display = '';
        this.elements.calculator3D.style.display = 'none';
    }
}
