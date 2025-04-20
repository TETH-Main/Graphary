/**
 * 報告機能を管理するクラス
 */
export class ReportManager {
    /**
     * @param {string} scriptUrl Google Apps Script URL
     * @param {Object} languageManager LanguageManager instance
     */
    constructor(scriptUrl, languageManager) {
        this.scriptUrl = scriptUrl;
        this.languageManager = languageManager;
        this.currentFormulaId = null;
        this.reportModal = null;
        this.form = null;
        this.submitButton = null;
        this.statusDiv = null;
        this.setupReportModal();
    }

    /**
     * 報告モーダルを設定
     */
    setupReportModal() {
        // 報告モーダルをDOMに追加
        const modalHTML = `
            <div id="report-modal" class="report-modal">
                <div class="report-modal-container">
                    <div class="report-modal-header">
                        <h2 class="report-modal-title" data-translate="report-title">問題を報告</h2>
                        <button class="report-modal-close" title="${this.languageManager.translate('close')}">&times;</button>
                    </div>
                    <form id="report-form" class="report-form">
                        <input type="hidden" id="report-formula-id">
                        <div class="report-form-group">
                            <label for="report-type" data-translate="report-type-label">報告の種類</label>
                            <select id="report-type" required>
                                <option value="" data-translate="report-select">選択してください</option>
                                <option value="incorrect" data-translate="report-type-incorrect">数式が間違っている</option>
                                <option value="inappropriate" data-translate="report-type-inappropriate">不適切なコンテンツ</option>
                                <option value="broken" data-translate="report-type-broken">画像が表示されない</option>
                                <option value="other" data-translate="report-type-other">その他</option>
                            </select>
                        </div>
                        <div class="report-form-group">
                            <label for="report-detail" data-translate="report-detail-label">詳細な説明</label>
                            <textarea id="report-detail" placeholder="${this.languageManager.translate('report-detail-placeholder')}" required></textarea>
                        </div>
                        <div id="report-status" class="report-status" style="display: none;"></div>
                        <div class="report-buttons">
                            <button type="button" class="report-button cancel" data-translate="cancel">キャンセル</button>
                            <button type="submit" class="report-button submit" data-translate="submit">送信</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 要素を取得
        this.reportModal = document.getElementById('report-modal');
        const closeButton = this.reportModal.querySelector('.report-modal-close');
        const cancelButton = this.reportModal.querySelector('.report-button.cancel');
        this.form = this.reportModal.querySelector('#report-form');
        this.submitButton = this.form.querySelector('.report-button.submit');
        this.statusDiv = this.reportModal.querySelector('#report-status');

        // イベントリスナーを設定
        closeButton.addEventListener('click', () => this.hideModal());
        cancelButton.addEventListener('click', () => this.hideModal());
        this.reportModal.addEventListener('click', (e) => {
            // モーダル背景クリックで閉じる
            if (e.target === this.reportModal) {
                this.hideModal();
            }
        });
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // 初期翻訳適用
        this.translateModal();
    }

    /**
     * モーダル内のテキストを翻訳
     */
    translateModal() {
        this.reportModal.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            el.textContent = this.languageManager.translate(key);
        });
        const placeholderEl = this.reportModal.querySelector('[placeholder]');
        if (placeholderEl) {
            placeholderEl.placeholder = this.languageManager.translate('report-detail-placeholder');
        }
        const closeBtn = this.reportModal.querySelector('.report-modal-close');
        if (closeBtn) {
            closeBtn.title = this.languageManager.translate('close');
        }
    }

    /**
     * モーダルを表示
     * @param {string} formulaId 報告対象の数式ID
     */
    showModal(formulaId) {
        this.currentFormulaId = formulaId;
        this.reportModal.querySelector('#report-formula-id').value = formulaId;
        this.translateModal(); // 表示時に再度翻訳
        this.reportModal.classList.add('active');
        // Formula modal is open, so body overflow should already be hidden
    }

    /**
     * モーダルを非表示
     */
    hideModal() {
        this.reportModal.classList.remove('active');
        this.resetForm();
        // Don't change body overflow here, let the formula modal handle it
    }

    /**
     * フォームをリセット
     */
    resetForm() {
        this.form.reset();
        this.submitButton.disabled = false;
        this.statusDiv.style.display = 'none';
        this.statusDiv.textContent = '';
        this.statusDiv.className = 'report-status';
    }

    /**
     * フォーム送信処理
     * @param {Event} e イベントオブジェクト
     */
    async handleSubmit(e) {
        e.preventDefault();
        this.submitButton.disabled = true;
        this.showStatusMessage(this.languageManager.translate('report-sending'), 'info');

        const type = document.getElementById('report-type').value;
        const detail = document.getElementById('report-detail').value;
        console.log("報告内容:", { type, detail });

        if (!type || !detail) {
            this.showStatusMessage(this.languageManager.translate('report-fill-all'), 'error');
            this.submitButton.disabled = false;
            return;
        }

        try {
            await this.sendReport({
                formulaId: this.currentFormulaId,
                reasonType: type,
                reason: detail,
                timestamp: new Date().toISOString()
            });
            this.showStatusMessage(this.languageManager.translate('report-success'), 'success');
            setTimeout(() => this.hideModal(), 2000); // Hide after 2 seconds on success
        } catch (error) {
            console.error('報告の送信に失敗しました:', error);
            this.showStatusMessage(this.languageManager.translate('report-error'), 'error');
            this.submitButton.disabled = false;
        }
    }

    /**
     * ステータスメッセージを表示
     * @param {string} message メッセージ
     * @param {'info'|'success'|'error'} type メッセージタイプ
     */
    showStatusMessage(message, type) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `report-status ${type}`;
        this.statusDiv.style.display = 'block';
    }

    /**
     * 報告を送信
     * @param {Object} data 報告データ
     * @returns {Promise<void>}
     */
    async sendReport(data) {
        // GASへの送信データに 'type' フィールドを追加（'report' を指定）
        const payload = { ...data, type: 'report' };
        console.log("Sending report data:", payload);

        const response = await fetch(this.scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for GAS web apps if not configured for CORS
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json' // Although no-cors, setting header is good practice
            },
            body: JSON.stringify(payload) // Send the payload including the 'type' field
        });

        // Note: With mode: 'no-cors', we cannot check response.ok or read the response body.
        // We assume success if the fetch call itself doesn't throw an error.
        // Proper error handling would require GAS to support CORS preflight requests (OPTIONS method)
        // or using JSONP if the GAS is configured for GET requests.
        // For now, we'll proceed assuming success.
        console.log("Report data sent (no-cors mode).");
    }
}
