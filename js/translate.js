/**
 * 現在設定されている言語を取得
 * @returns {string} 言語コード ('ja' または 'en')
 */
function getLanguage() {
    // 1. URLパラメータからの言語設定を優先
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'ja' || urlLang === 'en') {
        return urlLang;
    }
    
    // 2. ローカルストレージから言語設定を取得
    const storedLang = localStorage.getItem('preferred-language');
    if (storedLang === 'ja' || storedLang === 'en') {
        return storedLang;
    }
    
    // 3. デフォルトの言語を返す
    return 'ja'; // デフォルト言語は日本語
}

// 翻訳データを保持する変数
let translationsCache = {};

/**
 * 指定された言語の翻訳をロードして適用する
 * @param {string} lang - 言語コード ('ja' or 'en')
 * @returns {Promise<void>}
 */
async function loadTranslations(lang) {
    // サポート対象の言語かどうかチェック
    if (lang !== 'ja' && lang !== 'en') {
        lang = 'ja';
    }
    
    try {
        // 既にキャッシュにあれば、それを使用
        if (!translationsCache[lang]) {
            const response = await fetch(`./locales/${lang}.json`);
            
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}: ${response.status}`);
            }
            
            translationsCache[lang] = await response.json();
        }
        
        // 翻訳を適用
        applyTranslations(translationsCache[lang]);
    } catch (error) {
        // エラー時には、Japan語のファイルを読み込むことを試みる
        if (lang !== 'ja') {
            loadTranslations('ja');
        }
    }
}

/**
 * 翻訳データを適用する
 * @param {Object} translations - 翻訳データオブジェクト
 */
function applyTranslations(translations) {
    // 翻訳キーを持つ要素を取得して翻訳を適用
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });
    
    // フォーミュラタイプのチェックボックスラベルを翻訳
    translateFormulaTypeCheckboxes(translations);
}

/**
 * 数式タイプのチェックボックスラベルを翻訳
 * @param {Object} translations - 翻訳データオブジェクト
 */
function translateFormulaTypeCheckboxes(translations) {
    const checkboxes = document.querySelectorAll('#formula-type-checkboxes .checkbox-label span');
    
    checkboxes.forEach(span => {
        const key = span.getAttribute('data-translate');
        if (translations[key]) {
            span.textContent = translations[key];
        }
    });
}

/**
 * 数式タイプを言語に応じて翻訳する
 * @param {string} type - 原文の数式タイプ
 * @param {string} lang - 言語コード ('ja' or 'en')
 * @returns {string} 翻訳された数式タイプ
 */
function translateFormulaType(type, lang) {
    if (lang !== 'en') return type;
    
    const translations = translationsCache[lang];
    if (!translations) return type;
    
    const key = `formula_type_${type}`;
    return translations[key] || type;
}

/**
 * 言語切替時にUIを更新する
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function updateUIForLanguage(lang) {
    // プレースホルダーを更新
    updatePlaceholders(lang);
    
    // 翻訳を適用
    loadTranslations(lang);
}

/**
 * 翻訳キーに対応する文字列を取得する
 * @param {string} key - 翻訳キー
 * @param {string} lang - 言語コード ('ja' or 'en')
 * @returns {string} 翻訳された文字列、またはキーが見つからない場合はキー自体
 */
function getTranslation(key, lang) {
    const translations = translationsCache[lang];
    if (!translations) return key;
    
    return translations[key] || key;
}