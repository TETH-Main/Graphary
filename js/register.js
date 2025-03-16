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
            resultMessage: document.querySelector('.result-message')
        };

        // Desmosグラフ計算機のインスタンス
        this.desmosCalculator = null;
        this.calculatorLabelScreenshot = null;

        // Imgur API設定
        this.imgurClientId = 'fb9268d8cb1290a'; // ここにImgurのClient IDを設定

        // Google Apps Script URL
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbywoehTE4UmExGoOLtus0Xr48X4_LCcc3RMxV2tnXezCMuvVntYZuWPzPL3OrvvWh-C/exec'; // ここにGoogle Apps ScriptのURLを設定

        this.init();
    }

    /**
     * 初期化
     */
    init() {
        // Desmosグラフ計算機を初期化
        this.initDesmosCalculator();

        // イベントリスナーを設定
        this.setupEventListeners();
    }

    /**
     * Desmosグラフ計算機を初期化
     */
    initDesmosCalculator() {
        const desmosElement = document.getElementById('calculator');
        this.desmosCalculator = Desmos.GraphingCalculator(desmosElement);

        this.desmosCalculator.observeEvent('change', () => {
            this.elements.latexInput.value = this.getDesmosFormula();
        });

        this.calculatorLabelScreenshot = Desmos.GraphingCalculator(document.createElement('div'), {
            showGrid: false,
            showXAxis: false,
            showYAxis: false
        });
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // フォーム送信イベント
        this.elements.form.addEventListener('submit', (e) => {
            // Desmosコンテナ内のボタンがクリックされた場合は送信を防止
            if (e.submitter && e.submitter.closest('#desmos-calculator') && !e.submitter.hasAttribute('role')) {
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
                console.error('スクリーンショットエラー:', error);
                alert('スクリーンショットの取得に失敗しました');
            }
        });

        // Desmosコンテナ内のクリックイベントを停止
        this.elements.desmosContainer.addEventListener('click', (e) => {
            e.stopPropagation();
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
            console.error('数式登録エラー:', error);
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

        // タグ
        const tags = this.elements.tagsInput.value.trim();

        // LaTeX形式の数式
        this.elements.latexInput.value = this.getDesmosFormula();
        const formula = this.elements.latexInput.value.trim();

        return {
            title,
            formula_type: formulaType,
            tags,
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

            graphImg.src = this.desmosCalculator.screenshot({
                width: 320,
                height: 320,
                targetPixelRatio: screenshotParam.graphSize / 320
            });

            const label = this.getDesmosFormula();
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
        this.elements.registerStatus.classList.remove('hidden');
        this.elements.statusMessage.textContent = message;
        this.elements.registerResult.classList.add('hidden');
        this.elements.registerButton.disabled = true;
    }

    /**
     * 処理結果を表示
     * @param {boolean} success - 成功したかどうか
     * @param {string} message - 表示するメッセージ
     */
    showResult(success, message) {
        this.elements.registerStatus.classList.add('hidden');
        this.elements.registerResult.classList.remove('hidden');

        if (success) {
            this.elements.resultSuccess.classList.remove('hidden');
            this.elements.resultError.classList.add('hidden');
            this.elements.registerResult.style.backgroundColor = '#e8f5e9';
        } else {
            this.elements.resultSuccess.classList.add('hidden');
            this.elements.resultError.classList.remove('hidden');
            this.elements.registerResult.style.backgroundColor = '#ffebee';
        }

        this.elements.resultMessage.textContent = message;
        this.elements.registerButton.disabled = false;
    }

    /**
     * フォームをリセット
     */
    resetForm() {
        this.elements.form.reset();
        this.desmosCalculator.setBlank();
        this.elements.preview.style.display = 'none';

    }
}