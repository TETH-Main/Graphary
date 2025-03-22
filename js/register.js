/**
 * 数式登録フォームの処理を担当するクラス
 */
class FormulaRegister {
    /**
     * FormulaRegisterのコンストラクタ
     */
    constructor() {
        // DOM要素
        this.elements = {
            form: document.getElementById('formula-register-form'),
            titleInput: document.getElementById('formula-title'),
            typeCheckboxes: document.querySelectorAll('input[name="formula_type"]'),
            tagsInput: document.getElementById('formula-tags'),
            latexInput: document.getElementById('formula-latex'),
            desmosContainer: document.getElementById('desmos-calculator'),
            preview: document.getElementById('preview'),
            screenshot: document.getElementById('screenshot-button'),
            labelSize: document.querySelector('select[name="labelSize"]'),
            registerButton: document.getElementById('register-button'),
            registerStatus: document.getElementById('register-status'),
            statusMessage: document.querySelector('.status-message'),
            registerResult: document.getElementById('register-result'),
            resultSuccess: document.querySelector('.result-icon.success'),
            resultError: document.querySelector('.result-icon.error'),
            resultMessage: document.querySelector('.result-message'),
            desmosCalculator: document.getElementById('calculator'),
            desmos3d: document.getElementById('calculator-3d'),
            
            // タグ選択関連の要素
            selectedTagsContainer: document.getElementById('selected-tags-container'),
            tagSearchInput: document.getElementById('tag-search'),
            tagSuggestionsList: document.getElementById('tag-suggestions-list'),
            addNewTagButton: document.getElementById('add-new-tag'),
            createNewTagContainer: document.getElementById('create-new-tag-container'),
            newTagNameDisplay: document.getElementById('new-tag-name')
        };

        // Desmosグラフ計算機のインスタンス
        this.desmosCalculator = null;
        this.calculatorLabelScreenshot = null;
        this.desmos3D = null;

        // Imgur API設定
        this.imgurClientId = 'fb9268d8cb1290a'; // ここにImgurのClient IDを設定

        // Google Apps Script URL
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbzoaggjalkJVY0NbVjntDxxm3PWGpgdcieTczTXVrPWmx5lz7KquGptmY_qSjK0XGIu/exec'; // ここにGoogle Apps ScriptのURLを設定

        // タグ関連のデータ
        this.tagsData = {
            allTags: [], // 全てのタグデータ {id, name, name_EN}
            selectedTags: [], // 選択されたタグ {id, name} の配列
            filteredTags: [], // 検索でフィルタリングされたタグ
            isCreatingNewTag: false // 新規タグ作成モードかどうか
        };

        this.init();
    }

    /**
     * 初期化
     */
    init() {
        // Desmosグラフ計算機を初期化
        this.initDesmosCalculator();

        // タグデータを取得  
        this.fetchTagsData();

        // イベントリスナーを設定
        this.setupEventListeners();
    }

    /**
     * Desmosグラフ計算機を初期化
     */
    initDesmosCalculator() {
        this.desmosCalculator = Desmos.GraphingCalculator(this.elements.desmosCalculator);

        this.desmosCalculator.observeEvent('change', () => {
            this.elements.latexInput.value = this.getDesmosFormula();
        });

        this.calculatorLabelScreenshot = Desmos.GraphingCalculator(document.createElement('div'), {
            showGrid: false,
            showXAxis: false,
            showYAxis: false
        });

        this.elements.desmos3d.style.display = 'none';
        this.elements.desmos3d.onload = () => {
            this.desmos3D = this.elements.desmos3d.contentWindow.Calc;
            this.desmos3D.observeEvent('change', () => {
                this.elements.latexInput.value = this.getDesmosFormula3D();
            });    
        };
        
        // [+][-]がDesmosグラフ計算機が同時に挿入されるわけではないので3秒待つ
        setTimeout(() => {
            const buttons = this.elements.desmosContainer.querySelectorAll('button');
            buttons.forEach(button => {
                button.type = 'button';
            });
        }, 3000);

    }

    /**
     * タグデータを取得
     */
    async fetchTagsData() {
        try {
            // DataServiceからタグリストを取得
            const url = 'https://script.google.com/macros/s/AKfycbxoIgrjXYJ6tgvqoy83LWTFP61SZhm_UGgMZ4oJlLrwWUZrj1yPhOtZS6ocr1_mFoNW/exec?id=139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM&name=tagsList';

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tagsList = await response.json();

            if (!tagsList || !Array.isArray(tagsList) || tagsList.length === 0) {
                return false;
            }
            
            this.tagsData.allTags = tagsList.map(tag => ({
                id: tag.tagID.toString(),
                name: tag.tagName || '',
                name_EN: tag.tagName_EN || ''
            }));
                        
            // タグ候補を表示
            this.renderTagSuggestions(this.tagsData.allTags);
        } catch (error) {
            console.error('タグデータの取得に失敗しました:', error);
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // フォーム送信イベント
        this.elements.form.addEventListener('submit', (e) => {
            // Desmosコンテナ内のボタンがクリックされた場合は送信を防止
            if (e.submitter && e.submitter.classList.contains('dcg-unstyled-button')) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            this.handleFormSubmit();
        });

        // スクリーンショットボタンクリックイベント
        this.elements.screenshot.addEventListener('click', async () => {
            try {
                const screenshot = await this.getGraTeXScreenshot();
                this.elements.preview.src = screenshot;
                this.elements.preview.style.display = 'block';
            } catch (error) {
                alert('スクリーンショットの取得に失敗しました');
            }
        });

        // Desmosコンテナ内のクリックイベントを停止
        this.elements.desmosContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 2d/3d切り替えイベント
        document.querySelectorAll('input[name="version"]').forEach(element => {
            element.addEventListener('change', event => {
                const is2D = event.target.value === 'version-2d';
                this.elements.desmosCalculator.style.display = is2D ? '' : 'none';
                this.elements.desmos3d.style.display = is2D ? 'none' : '';

                // Automatically check the "3D" formula type checkbox when 3D version is selected
                const formulaType3DCheckbox = Array.from(this.elements.typeCheckboxes).find(checkbox => checkbox.value === '3D');
                if (formulaType3DCheckbox) {
                    formulaType3DCheckbox.checked = !is2D;
                }
            });
        });

        // タグ検索入力
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
                // 検索テキストが空の場合はフォーカスして注意を促す
                this.elements.tagSearchInput.focus();
                this.elements.tagSearchInput.classList.add('error-highlight');
                setTimeout(() => {
                    this.elements.tagSearchInput.classList.remove('error-highlight');
                }, 2000);
            }
        });
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
            this.showStatus('数式を登録中...');

            // フォームデータを取得
            const formulaData = this.getFormData();

            // Desmosからスクリーンショットを取得
            const screenshot = this.getScreenshotData();

            // Imgurに画像をアップロード
            const imageHash = await this.uploadToImgur(screenshot);

            // Google Apps Scriptに送信
            const result = await this.sendToGoogleAppsScript({
                ...formulaData,
                image_url: imageHash
            }, 'formula');

            // 成功メッセージを表示
            this.showResult(true, 'アップロード成功！数式が登録されました。');

            // フォームをリセット
            this.resetForm();
        } catch (error) {
            this.showResult(false, `エラーが発生しました: ${error.message}`);
        }
    }

    /**
     * フォームのバリデーション
     * @returns {boolean} バリデーション結果
     */
    validateForm() {
        // タイトルのバリデーション
        if (!this.elements.titleInput.value.trim()) {
            alert('タイトルを入力してください');
            this.elements.titleInput.focus();
            return false;
        }

        // 数式タイプのバリデーション
        const selectedTypes = Array.from(this.elements.typeCheckboxes)
            .filter(checkbox => checkbox.checked);

        if (selectedTypes.length === 0) {
            alert('少なくとも1つの数式タイプを選択してください');
            return false;
        }

        // タグのバリデーション
        if (this.tagsData.selectedTags.length === 0) {
            alert('少なくとも1つのタグを選択してください');
            this.elements.tagSearchInput.focus();
            return false;
        }

        if (!this.elements.tagsInput.value.trim()) {
            alert('タグを入力してください');
            this.elements.tagsInput.focus();
            return false;
        }

        // LaTeX形式の数式のバリデーション
        if (!this.elements.latexInput.value.trim()) {
            alert('Desmosで数式を入力してください');
            return false;
        }

        if (!this.getScreenshotData()) {
            alert('スクリーンショットを取得してください');
            return false;
        }

        return true;
    }

    /**
     * フォームデータを取得
     * @returns {Object} フォームデータ
     */
    getFormData() {
        // タイトル
        const title = this.elements.titleInput.value.trim();

        // 数式タイプ（カンマ区切り）
        const formulaType = Array.from(this.elements.typeCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value)
            .join(', ');

        // タグ（既存タグのIDのカンマ区切り）
        const existingTagIds = this.tagsData.selectedTags
            .filter(tag => !tag.isNew)
            .map(tag => tag.id)
            .join(',');

        // 新しいタグ（名前のカンマ区切り）
        const newTags = this.tagsData.selectedTags
            .filter(tag => tag.isNew)
            .map(tag => tag.name)
            .join(',');

        // LaTeX形式の数式
        this.elements.latexInput.value = this.getDesmosFormula();
        const formula = this.elements.latexInput.value.trim();

        return {
            title,
            formula_type: formulaType,
            tags: existingTagIds,
            newTags: newTags,  // 新しいタグの追加
            formula
        };
    }

    /**
     * Desmosグラフ計算機の数式を取得
     * @returns {string} LaTeX形式の数式
     */
    getDesmosFormula() {
        const exp = this.desmosCalculator.getExpressions().find(exp => exp.latex);
        if(!exp) return '';
        return exp.latex;
    }

    /**
     * 3D Desmosグラフ計算機の数式を取得
     * @returns {string} LaTeX形式の数式
     */
    getDesmosFormula3D() {
        const exp = this.desmos3D.getExpressions().find(exp => exp.latex);
        if(!exp) return '';
        return exp.latex;
    }

    /**
     * スクリーンショットのBase64形式の画像データを取得
     * @returns {string} Base64形式の画像データ
     */
    getScreenshotData() {
        if(this.elements.preview.href === '') return null;
        return this.elements.preview.href;
    }

    /**
     * Desmosからスクリーンショットを取得
     * @returns {Promise<string>} Base64形式の画像データ
     */
    async getGraTeXScreenshot() {
        const screenshotParam = {
            width: 1920,
            height: 1080,
            graphSize: 640,
            graphMargin: 96,
            labelPos: 720,
            labelSize: this.elements.labelSize.value,
            fillColor: '#ffffff'
        };
        const is2D = document.querySelector('input[name="version"]:checked').value === 'version-2d';

        return new Promise((resolve, reject) => {
            const graphImg = new Image();
            const mergeImg = new Image();
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = screenshotParam.width;
            canvas.height = screenshotParam.height;
            
            Promise.all([
                new Promise(resolve => (graphImg.onload = resolve)),
                new Promise(resolve => (mergeImg.onload = resolve))
            ]).then(() => {
                context.fillStyle = screenshotParam.fillColor;
                context.fillRect(0, 0, screenshotParam.width, screenshotParam.height);

                const graphWidth = screenshotParam.graphSize;
                const graphLeft = (screenshotParam.width - graphWidth) >> 1;
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

                const base64Image = canvas.toDataURL();
                this.elements.preview.href = base64Image;
                resolve(base64Image);
            }).catch(error => {
                reject(error);
            });

            const calculator = is2D ? this.desmosCalculator : this.desmos3D;

            graphImg.src = calculator.screenshot({
                width: 320,
                height: 320,
                targetPixelRatio: screenshotParam.graphSize / 320
            });

            const label = is2D ? this.getDesmosFormula() : this.getDesmosFormula3D();
            const ratio = (Math.min(screenshotParam.width, screenshotParam.height) >= 360) + 1;
            this.calculatorLabelScreenshot.setExpression({
                id: 'label',
                latex: `\\left(0,-${screenshotParam.labelPos / ratio}\\right)`,
                color: 'black',
                label: `\`${label}\``,
                hidden: true,
                showLabel: true,
                secret: true,
                labelSize: screenshotParam.labelSize * screenshotParam.labelPos + '/' + 720 * ratio
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
                        bottom: -screenshotParam.height,
                        top: screenshotParam.height
                    }
                },
                s => (mergeImg.src = s)
            );
        });
    }

    /**
     * Imgurに画像をアップロード
     * @param {string} base64Image - Base64形式の画像データ
     * @returns {Promise<string>} Imgurのハッシュ
     */
    async uploadToImgur(base64Image) {
        // Base64データからヘッダーを削除
        const imageData = base64Image.split(',')[1];

        try {
            const response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Client-ID ${this.imgurClientId}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    type: 'base64'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.data.error || 'Imgurへのアップロードに失敗しました');
            }

            // Imgurのハッシュを返す
            return 'https://i.imgur.com/' + result.data.id + '.png';

        } catch (error) {
            console.error('Imgurアップロードエラー:', error);
            throw new Error('画像のアップロードに失敗しました');
        }
    }

    /**
     * Google Apps Scriptに送信
     * @param {Object} data - 送信データ
     * @param {string} type - データの種類（'formula' または 'report'）
     * @returns {Promise<Object>} レスポンス
     */
    async sendToGoogleAppsScript(data, type) {
        console.log('Sending data to GAS:', { ...data, type });
        try {
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Scriptの場合は'no-cors'モードが必要
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...data, type })
            });

            // 注: no-corsモードではレスポンスの内容を読み取れないため、
            // 成功したと仮定して処理を続行します
            return { success: true };

        } catch (error) {
            console.error('Google Apps Script送信エラー:', error);
            throw new Error('データの送信に失敗しました');
        }
    }

    /**
     * 処理状態を表示
     * @param {string} message - 表示するメッセージ
     */
    showStatus(message) {
        console.log('Showing status:', message);
        this.elements.registerStatus.classList.remove('hidden');
        this.elements.statusMessage.setAttribute('data-translate', 'processing-message');
        this.elements.registerResult.classList.add('hidden');
        this.elements.registerButton.disabled = true;
    }

    /**
     * 処理結果を表示
     * @param {boolean} success - 成功したかどうか
     * @param {string} message - 表示するメッセージ
     */
    showResult(success, message) {
        console.log('Showing result:', success, message);
        this.elements.registerStatus.classList.add('hidden');
        this.elements.registerResult.classList.remove('hidden');

        if (success) {
            this.elements.resultSuccess.classList.remove('hidden');
            this.elements.resultError.classList.add('hidden');
            this.elements.resultSuccess.style.display = 'block';
            this.elements.resultError.style.display = 'none';
            this.elements.registerResult.style.backgroundColor = '#e8f5e9';
            document.querySelector('.success-message').classList.remove('hidden');
            document.querySelector('.error-message').classList.add('hidden');
        } else {
            this.elements.resultSuccess.classList.add('hidden');
            this.elements.resultError.classList.remove('hidden');
            this.elements.resultSuccess.style.display = 'none';
            this.elements.resultError.style.display = 'block';
            this.elements.registerResult.style.backgroundColor = '#ffebee';
            document.querySelector('.success-message').classList.add('hidden');
            document.querySelector('.error-message').classList.remove('hidden');
        }

        this.elements.registerButton.disabled = false;
    }

    /**
     * フォームをリセット
     */
    resetForm() {
        this.elements.form.reset();
        this.desmosCalculator.setBlank();
        this.elements.preview.style.display = 'none';

        // 選択されているすべてのタグを削除
        const selectedTagsCopy = [...this.tagsData.selectedTags];
        selectedTagsCopy.forEach(tag => {
            this.removeTag(tag.id);
        });
    }

    /**
     * タグ検索処理
     */
    handleTagSearch() {
        const searchText = this.elements.tagSearchInput.value.trim().toLowerCase();
        
        if (searchText === '') {
            // 検索テキストが空の場合は全てのタグを表示（選択済みのものを除く）
            this.tagsData.isCreatingNewTag = false;
            this.elements.createNewTagContainer.classList.add('hidden');
            this.filterAndRenderTagSuggestions();
        } else {
            // 検索テキストでタグをフィルタリング
            const filteredTags = this.tagsData.allTags.filter(tag => 
                (tag.name.toLowerCase().includes(searchText) || 
                 tag.name_EN.toLowerCase().includes(searchText)) && 
                !this.isTagSelected(tag.id)
            );
            
            // フィルタリングされたタグを表示
            this.tagsData.filteredTags = filteredTags;
            this.renderTagSuggestions(filteredTags);
            
            // 完全一致するタグがない場合、新規タグ作成の表示
            const exactMatch = filteredTags.some(tag => 
                tag.name.toLowerCase() === searchText || 
                tag.name_EN.toLowerCase() === searchText
            );
            
            if (!exactMatch) {
                this.tagsData.isCreatingNewTag = true;
                this.elements.newTagNameDisplay.textContent = searchText;
                this.elements.createNewTagContainer.classList.remove('hidden');
            } else {
                this.tagsData.isCreatingNewTag = false;
                this.elements.createNewTagContainer.classList.add('hidden');
            }
        }
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
        console.log('Creating new tag:', tagName);
        // 新規タグのIDを生成（実際のシステムではサーバーからIDが割り当てられる）
        // ここではクライアント側で仮のIDを生成して使用
        const newTagId = `new_${Date.now()}`;
        
        // 新規タグを選択状態にする
        this.addTag({
            id: newTagId,
            name: tagName,
            name_EN: tagName, // 英語名は仮に同じにする（実際のシステムではAPI側で処理）
            isNew: true // 新規タグのフラグ
        });
        
        // 新規タグ作成モードを解除
        this.tagsData.isCreatingNewTag = false;
        this.elements.createNewTagContainer.classList.add('hidden');
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
    renderTagSuggestions(tags) {
        this.elements.tagSuggestionsList.innerHTML = '';
        
        if (tags.length === 0) {
            // タグがない場合はメッセージを表示
            const noTagsMessage = document.createElement('div');
            noTagsMessage.className = 'no-tags-message';
            noTagsMessage.textContent = getTranslation('no-tags-found', getLanguage());
            this.elements.tagSuggestionsList.appendChild(noTagsMessage);
            return;
        }
        
        // 言語設定を取得
        const lang = getLanguage();
        
        // タグをソート（日本語または英語名でアルファベット順）
        tags.sort((a, b) => {
            const nameA = lang === 'en' && a.name_EN ? a.name_EN : a.name;
            const nameB = lang === 'en' && b.name_EN ? b.name_EN : b.name;
            return nameA.localeCompare(nameB);
        });
        
        // タグ候補要素を作成
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-suggestion';
            // 言語に応じた表示
            tagElement.textContent = lang === 'en' && tag.name_EN ? tag.name_EN : tag.name;
            tagElement.setAttribute('data-translate-tag', tag.name); // Add data-translate-tag attribute
            tagElement.dataset.tagNameEn = tag.name_EN; // Store English name for translation

            // クリックイベントでタグを追加
            tagElement.addEventListener('click', () => {
                this.addTag(tag);
            });
            
            this.elements.tagSuggestionsList.appendChild(tagElement);
        });
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
        
        // タグ要素を作成して選択済みタグコンテナに追加
        const tagElement = document.createElement('div');
        tagElement.className = 'selected-tag';
        
        // タグテキスト
        const tagText = document.createElement('span');
        tagText.className = 'selected-tag-text';
        // 言語に応じた表示
        const lang = getLanguage();
        tagText.textContent = lang === 'en' && tag.name_EN ? tag.name_EN : tag.name;
        
        // 削除ボタン
        const removeButton = document.createElement('button');
        removeButton.className = 'selected-tag-remove';
        removeButton.innerHTML = '<i class="fas fa-times"></i>';
        removeButton.title = lang === 'en' ? 'Remove tag' : 'タグを削除';
        
        // 削除ボタンのクリックイベント
        removeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.removeTag(tag.id);
        });
        
        // 要素を組み立て
        tagElement.appendChild(tagText);
        tagElement.appendChild(removeButton);
        
        // コンテナに追加
        this.elements.selectedTagsContainer.appendChild(tagElement);
        
        // 検索フィールドをクリアしてフォーカス
        this.elements.tagSearchInput.value = '';
        this.elements.tagSearchInput.focus();
        
        // 選択状態を更新
        this.updateSelectedTagsInput();
        
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
        
        // 選択済みタグコンテナを再レンダリング
        this.renderSelectedTags();
        
        // タグ候補を再フィルタリング
        this.filterAndRenderTagSuggestions();
    }

    /**
     * 選択されたタグを再レンダリング
     */
    renderSelectedTags() {
        this.elements.selectedTagsContainer.innerHTML = '';
        
        const lang = getLanguage();
        
        // 選択されたタグをレンダリング
        this.tagsData.selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'selected-tag';
            
            // タグテキスト
            const tagText = document.createElement('span');
            tagText.className = 'selected-tag-text';
            // 言語に応じた表示
            tagText.textContent = lang === 'en' && tag.name_EN ? tag.name_EN : tag.name;
            
            // 削除ボタン
            const removeButton = document.createElement('button');
            removeButton.className = 'selected-tag-remove';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.title = lang === 'en' ? 'Remove tag' : 'タグを削除';
            
            // 削除ボタンのクリックイベント
            removeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.removeTag(tag.id);
            });
            
            // 要素を組み立て
            tagElement.appendChild(tagText);
            tagElement.appendChild(removeButton);
            
            // コンテナに追加
            this.elements.selectedTagsContainer.appendChild(tagElement);
        });
        
        // 選択状態を更新
        this.updateSelectedTagsInput();
    }

    /**
     * 選択されたタグの値を隠しフィールドに設定
     */
    updateSelectedTagsInput() {
        // タグIDをカンマ区切りの文字列に変換
        const tagIds = this.tagsData.selectedTags.map(tag => tag.id).join(',');
        this.elements.tagsInput.value = tagIds;
    }
}