/**
 * 言語切り替え機能
 */
document.addEventListener('DOMContentLoaded', () => {
    const langButtons = document.querySelectorAll('.lang-button');
    const htmlElement = document.documentElement;

    // 初期言語の設定
    const initialLang = getLanguage();
    updateLanguageUI(initialLang);

    // 言語切り替えボタンのイベント設定
    langButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const newLang = button.getAttribute('data-lang');
            
            // 現在の言語が選択された場合は何もしない
            if (getLanguage() === newLang) return;
            
            // 言語を切り替える
            setLanguage(newLang);
            updateLanguageUI(newLang);
            
            // ボタンのアクティブ状態を更新
            langButtons.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-lang') === newLang);
            });
            
            // 翻訳を適用
            await loadTranslations(newLang);
            
            // UIControllerにも言語変更を通知
            if (window.app && window.app.uiController) {
                window.app.uiController.switchLanguage(newLang);
            }
        });
    });
});

/**
 * 現在の言語を取得
 * @returns {string} 言語コード ('ja' or 'en')
 */
function getLanguage() {
    return localStorage.getItem('language') || 'ja';
}

/**
 * 言語を設定
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function setLanguage(lang) {
    localStorage.setItem('language', lang);
}

/**
 * 言語設定に応じてUIを更新
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function updateLanguageUI(lang) {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('lang', lang);
    
    // ボタンのアクティブ状態を更新
    const langButtons = document.querySelectorAll('.lang-button');
    langButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    
    // プレースホルダーテキストも更新
    updatePlaceholders(lang);
}

/**
 * 言語設定に応じてプレースホルダーを更新
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function updatePlaceholders(lang) {
    const placeholders = document.querySelectorAll('[data-translate-placeholder]');
    
    placeholders.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (lang === 'en') {
            switch(key) {
                case 'keyword-search-placeholder':
                    element.placeholder = 'Search by formula or type...';
                    break;
                case 'title-placeholder':
                    element.placeholder = 'Example: Graph of Quadratic Function';
                    break;
                case 'tags-placeholder':
                    element.placeholder = 'Example: quadratic function, parabola, algebra';
                    break;
                case 'report-reason-placeholder':
                    element.placeholder = 'Please enter the reason for reporting...';
                    break;
                // 他のプレースホルダーを追加
            }
        } else {
            switch(key) {
                case 'keyword-search-placeholder':
                    element.placeholder = '数式やタイプで検索...';
                    break;
                case 'title-placeholder':
                    element.placeholder = '例: 二次関数のグラフ';
                    break;
                case 'tags-placeholder':
                    element.placeholder = '例: 二次関数,放物線,代数学';
                    break;
                case 'report-reason-placeholder':
                    element.placeholder = '報告理由を入力してください...';
                    break;
                // 他のプレースホルダーを追加
            }
        }
    });
}
