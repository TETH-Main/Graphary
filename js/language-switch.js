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

    // タグの言語を更新
    if (window.app && window.app.formulaRegister) {
        window.app.formulaRegister.renderSelectedTags(lang);
    }
}

/**
 * 言語設定に応じてプレースホルダーを更新
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
async function updatePlaceholders(lang) {
    const placeholders = document.querySelectorAll('[data-translate-placeholder]');
    const translations = await fetchTranslations(lang);

    placeholders.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        element.placeholder = translations[key] || element.placeholder;
    });

    // Update text content for elements with data-translate attribute
    const translatableElements = document.querySelectorAll('[data-translate]');
    translatableElements.forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = translations[key] || element.textContent;
    });

    // Update text content for elements with data-translate-tag attribute
    const translatableTags = document.querySelectorAll('[data-translate-tag]');
    translatableTags.forEach(element => {
        const tagName = element.getAttribute('data-translate-tag');
        element.textContent = lang === 'en' ? element.dataset.tagNameEn : tagName;
    });
}

/**
 * 言語設定に応じた翻訳データを取得
 * @param {string} lang - 言語コード ('ja' or 'en')
 * @returns {Promise<Object>} 翻訳データ
 */
async function fetchTranslations(lang) {
    const response = await fetch(`./locales/${lang}.json`);
    return response.json();
}
