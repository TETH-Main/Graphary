class ReportRegister {
    constructor() {
        this.elements = {
            reportModal: document.getElementById('report-modal'),
            reportReason: document.getElementById('report-reason'),
            reportSubmit: document.getElementById('report-submit'),
            reportClose: document.getElementById('report-close')
        };

        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbywoehTE4UmExGoOLtus0Xr48X4_LCcc3RMxV2tnXezCMuvVntYZuWPzPL3OrvvWh-C/exec'; // ここにGoogle Apps ScriptのURLを設定

        // Report modal close button event listener
        if (this.elements.reportClose) {
            this.elements.reportClose.addEventListener('click', () => this.closeReportModal());
        }

        // Report submit button event listener
        if (this.elements.reportSubmit) {
            this.elements.reportSubmit.addEventListener('click', () => this.submitReport());
        }
    }

    /**
     * 報告モーダルを開く
     * @param {Formula} formula - 報告対象の数式オブジェクト
     */
    openReportModal(formula) {
        this.currentFormula = formula;
        this.elements.reportReason.value = '';
        this.elements.reportModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    /**
     * 報告モーダルを閉じる
     */
    closeReportModal() {
        this.elements.reportModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    /**
     * 報告を送信
     */
    async submitReport() {
        const reason = this.elements.reportReason.value.trim();
        if (!reason) {
            alert('報告理由を入力してください。');
            return;
        }

        const reportData = {
            formulaId: this.currentFormula.id,
            reason: reason
        };

        try {
            const result = await this.sendToGoogleAppsScript(reportData, 'report');
            alert('報告が送信されました。');
            this.closeReportModal();
        } catch (error) {
            console.error('報告の送信に失敗しました:', error);
            alert('報告の送信に失敗しました。');
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
}
