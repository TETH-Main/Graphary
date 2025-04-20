/**
 * 言語設定を管理するクラス
 */
export class LanguageManager {
    constructor() {
        this.currentLang = 'jp';
        this.translations = {
            jp: {
                search: '検索',
                'how-to-use': '使い方',
                'keyword-search': 'キーワード検索',
                'keyword-search-placeholder': '数式やタイプで検索...',
                'tag-search': 'タグ検索',
                'formula-type-search': '数式タイプ検索',
                'search-results': '検索結果',
                sort: '並び替え',
                'id-asc': 'ID（昇順）',
                'id-desc': 'ID（降順）',
                'type-asc': 'タイプ（A-Z）',
                'type-desc': 'タイプ（Z-A）',
                'items-per-page': '1ページあたりの表示件数',
                loading: '読み込み中...',
                'how-to-use-title': '数式検索サイトの使い方',
                'search-methods': '1. 数式の検索方法',
                'keyword-search-description': '検索ボックスに数式のタイトル、数式自体、または数式タイプに含まれる単語を入力して検索できます。',
                'keyword-search-example': '例: 「二次方程式」「sin」「微分」など',
                'tag-search-description': 'タグをクリックして、特定のカテゴリに属する数式を検索できます。複数のタグを選択すると、すべてのタグに一致する数式が表示されます。',
                'tag-search-example': '例: 「円」「四角」「繰り返し」など',
                'formula-type-search-description': '数式タイプをクリックして、特定のタイプの数式を検索できます。',
                'formula-type-search-example': '例: 「関数」「3D」「複素数」など',
                'view-results': '2. 検索結果の見方',
                'formula-card': '数式カード',
                'formula-card-description': '検索結果は数式カードとして表示されます。各カードには以下の情報が含まれています：',
                image: '画像:',
                'image-description': '数式の視覚的表現',
                title: 'タイトル',
                'title-description': '数式の名前や説明',
                'formula-type': '数式タイプ:',
                'formula-type-description': '数式の分類（画像の右上に表示）',
                formula: '数式:',
                'formula-description': 'コピー可能な形式の数式',
                tags: 'タグ',
                'tags-description': '関連するキーワード',
                id: 'ID:',
                'id-description': '数式の固有識別子',
                'copy-formula': '数式のコピー',
                'copy-formula-description': '数式の横にあるコピーボタンをクリックすると、数式をクリップボードにコピーできます。',
                'copy-formula-instruction': 'コピーした数式は、LaTeXをサポートするエディタやドキュメントに貼り付けることができます。',
                noResults: '検索条件に一致する数式カードがありません。',
                footer: '© Math Graph Art Search by TETH_Main',
                copy: 'コピー',
                copySuccess: 'コピー完了',
                copyError: 'エラー',
                pageInfo: (start, end, total) => `${start} - ${end} 件表示 / 全 ${total} 件`,
                clearAll: 'すべてクリア',
                report: '問題を報告',
                'report-feature-coming-soon': '報告機能は近日公開予定です。',
                'report-title': '問題を報告',
                'report-type-label': '報告の種類',
                'report-select': '選択してください',
                'report-type-incorrect': '数式が間違っている',
                'report-type-inappropriate': '不適切なコンテンツ',
                'report-type-broken': '画像が表示されない',
                'report-type-other': 'その他',
                'report-detail-label': '詳細な説明',
                'report-detail-placeholder': '問題の詳細を入力してください...',
                'cancel': 'キャンセル',
                'submit': '送信',
                'close': '閉じる',
                'report-sending': '送信中...',
                'report-success': '報告が送信されました。ありがとうございます。',
                'report-error': '報告の送信に失敗しました。後でもう一度お試しください。',
                'report-fill-all': 'すべてのフィールドを入力してください。',
                // 登録モーダル関連の翻訳を追加
                'register-title': '数式登録フォーム',
                'register-formula-title': 'タイトル',
                'register-formula-title-placeholder': '例: 二次関数のグラフ',
                'register-formula-type': '数式タイプ',
                'register-tags': 'タグ',
                'register-tags-placeholder': 'タグを検索...',
                'register-formula-input': '数式入力',
                'register-submit': '数式を登録する',
                'register-processing': '処理中...',
                'register-success': 'アップロード成功！数式が登録されました。',
                'register-error': 'エラーが発生しました: ',
                'register-available-tags': '追加可能なタグ',
                'register-search-tags': 'タグを検索',
                'register-no-tags': 'タグが見つかりません',
                'register-remove-tag': 'タグを削除',
                'register-create-new-tag': '新規タグ作成',
                'register-will-create-tag': '新しいタグを作成',
                'function': '関数',
                'implicit': '陰関数', // Added
                'implicit-function': '陰関数',
                'parametric': '媒介変数',
                'polar': '極座標',
                'complex': '複素数',
                '3d': '3D', // Changed from '3次元' for consistency if key is '3d'
                'algebraic': '代数', // Added
                'calculus': '微積分', // Added
                'geometry': '幾何学', // Added
                'statistics': '統計', // Added
                'vector': 'ベクトル', // Added
                'matrix': '行列', // Added
                'differential': '微分方程式', // Added
                'integral': '積分', // Added
                'trigonometry': '三角関数', // Added
                'probability': '確率', // Added
                'series': '級数', // Added
                'limit': '極限', // Added
                'register-button': '数式を登録する',
                'processing-message': '処理中...',
                'result-message-success': 'アップロード成功！数式が登録されました。',
                'result-message-error': 'エラーが発生しました: ',
                'title': 'タイトル',
                'tags': 'タグ',
                'search-tags-placeholder': 'タグを検索...',
                'available-tags': '追加可能なタグ',
                'create-new-tag': '新規タグを作成',
                'formula-input': '数式入力',
                'title-placeholder': '例: 二次関数のグラフ',
                'will-create-tag': '新しいタグ「{tag}」を作成します',
                'create-new-tag-message': '新しいタグ「{tagName}」を作成します。',
                '関数': '関数',
                '陰関数': '陰関数', // Added
                '陰関数-詳細': '陰関数',
                '媒介変数': '媒介変数',
                '極座標': '極座標',
                '複素数': '複素数',
                '3次元': '3D', // Changed from '3次元' for consistency if key is '3d'
                '代数': '代数', // Added
                '微積分': '微積分', // Added
                '幾何学': '幾何学', // Added
                '統計': '統計', // Added
                'ベクトル': 'ベクトル', // Added
                '行列': '行列', // Added
                '微分方程式': '微分方程式', // Added
                '積分': '積分', // Added
                '三角関数': '三角関数', // Added
                '確率': '確率', // Added
                '級数': '級数', // Added
                '極限': '極限', // Added
            },
            en: {
                search: 'Search',
                'how-to-use': 'How to Use',
                'keyword-search': 'Keyword Search',
                'keyword-search-placeholder': 'Search by formula or type...',
                'tag-search': 'Tag Search',
                'formula-type-search': 'Formula Type Search',
                'search-results': 'Search Results',
                sort: 'Sort by',
                'id-asc': 'ID (Ascending)',
                'id-desc': 'ID (Descending)',
                'type-asc': 'Type (A-Z)',
                'type-desc': 'Type (Z-A)',
                'items-per-page': 'Items per page',
                loading: 'Loading...',
                'how-to-use-title': 'How to Use the Formula Search',
                'search-methods': '1. How to Search Formulas',
                'keyword-search-description': 'Enter words contained in formula title, formula itself, or formula type in the search box.',
                'keyword-search-example': 'Example: "quadratic", "sin", "derivative", etc.',
                'tag-search-description': 'Click on tags to search for formulas in specific categories. Selecting multiple tags will show formulas that match all selected tags.',
                'tag-search-example': 'Example: "circle", "square", "recursion", etc.',
                'formula-type-search-description': 'Click on formula types to search for formulas of a specific type.',
                'formula-type-search-example': 'Example: "function", "3D", "complex", etc.',
                'view-results': '2. Understanding Search Results',
                'formula-card': 'Formula Card',
                'formula-card-description': 'Search results are displayed as formula cards. Each card contains the following information:',
                image: 'Image:',
                'image-description': 'Visual representation of the formula',
                title: 'Title',
                'title-description': 'Name or description of the formula',
                'formula-type': 'Formula Type:',
                'formula-type-description': 'Classification of the formula (shown at the top right of the image)',
                formula: 'Formula:',
                'formula-description': 'The formula in copyable format',
                tags: 'Tags',
                'tags-description': 'Related keywords',
                id: 'ID:',
                'id-description': 'Unique identifier of the formula',
                'copy-formula': 'Copying Formulas',
                'copy-formula-description': 'Click the copy button next to the formula to copy it to your clipboard.',
                'copy-formula-instruction': 'The copied formula can be pasted into editors or documents that support LaTeX.',
                noResults: 'No formula cards match your search criteria.',
                footer: '© 2024 Graphary - Formula Card Library',
                copy: 'Copy',
                copySuccess: 'Copied',
                copyError: 'Error',
                pageInfo: (start, end, total) => `${start} - ${end} of ${total} items`,
                clearAll: 'Clear All',
                report: 'Report an issue',
                'report-feature-coming-soon': 'Report feature coming soon.',
                'report-title': 'Report an Issue',
                'report-type-label': 'Type of Issue',
                'report-select': 'Please select',
                'report-type-incorrect': 'Incorrect Formula',
                'report-type-inappropriate': 'Inappropriate Content',
                'report-type-broken': 'Image Not Displaying',
                'report-type-other': 'Other',
                'report-detail-label': 'Detailed Description',
                'report-detail-placeholder': 'Please describe the issue...',
                'cancel': 'Cancel',
                'submit': 'Submit',
                'close': 'Close',
                'report-sending': 'Sending...',
                'report-success': 'Report submitted successfully. Thank you.',
                'report-error': 'Failed to submit report. Please try again later.',
                'report-fill-all': 'Please fill in all fields.',
                // 英語の翻訳を追加
                'register-title': 'Formula Registration Form',
                'register-formula-title': 'Title',
                'register-formula-title-placeholder': 'Example: Graph of Quadratic Function',
                'register-formula-type': 'Formula Type',
                'register-tags': 'Tags',
                'register-tags-placeholder': 'Search tags...',
                'register-formula-input': 'Formula Input',
                'register-submit': 'Register Formula',
                'register-processing': 'Processing...',
                'register-success': 'Upload successful! Formula has been registered.',
                'register-error': 'An error occurred: ',
                'register-available-tags': 'Available Tags',
                'register-search-tags': 'Search Tags',
                'register-no-tags': 'No tags found',
                'register-remove-tag': 'Remove tag',
                'register-create-new-tag': 'Create new tag',
                'register-will-create-tag': 'Create new tag',
                'function': 'Function',
                'implicit': 'Implicit', // Added
                'implicit-function': 'Implicit Function',
                'parametric': 'Parametric',
                'polar': 'Polar',
                'complex': 'Complex',
                '3d': '3D',
                'algebraic': 'Algebraic', // Added
                'calculus': 'Calculus', // Added
                'geometry': 'Geometry', // Added
                'statistics': 'Statistics', // Added
                'vector': 'Vector', // Added
                'matrix': 'Matrix', // Added
                'differential': 'Differential', // Added
                'integral': 'Integral', // Added
                'trigonometry': 'Trigonometry', // Added
                'probability': 'Probability', // Added
                'series': 'Series', // Added
                'limit': 'Limit', // Added
                'register-button': 'Register Formula',
                'processing-message': 'Processing...',
                'result-message-success': 'Upload successful! Formula has been registered.',
                'result-message-error': 'An error occurred: ',
                'title': 'Title',
                'tags': 'Tags',
                'search-tags-placeholder': 'Search tags...',
                'available-tags': 'Available Tags',
                'create-new-tag': 'Create New Tag',
                'formula-input': 'Formula Input',
                'title-placeholder': 'Example: Quadratic Function Graph',
                'will-create-tag': 'Will create a new tag "{tag}"',
                'create-new-tag-message': 'Will create new tag "{tagName}"',
                '関数': 'Function',
                '陰関数': 'Implicit', // Added
                '陰関数-詳細': 'Implicit Function',
                '媒介変数': 'Parametric',
                '極座標': 'Polar',
                '複素数': 'Complex',
                '3次元': '3D', // Changed from '3次元' for consistency if key is '3d'
                '代数': 'Algebraic', // Added
                '微積分': 'Calculus', // Added
                '幾何学': 'Geometry', // Added
                '統計': 'Statistics', // Added
                'ベクトル': 'Vector', // Added
                '行列': 'Matrix', // Added
                '微分方程式': 'Differential', // Added
                '積分': 'Integral', // Added
                '三角関数': 'Trigonometry', // Added
                '確率': 'Probability', // Added
                '級数': 'Series', // Added
                '極限': 'Limit', // Added
            }
        };

        this.observers = [];
    }

    /**
     * 言語切替機能の初期化
     */
    init() {
        // 保存された言語設定を読み込む
        const savedLang = localStorage.getItem('language') || 'jp';
        this.setLanguage(savedLang);
        
        // 言語切替ボタンのイベントリスナー設定
        document.getElementById('lang-jp').addEventListener('click', () => this.setLanguage('jp'));
        document.getElementById('lang-en').addEventListener('click', () => this.setLanguage('en'));
        
        // モバイル版の言語切替ボタンも設定
        if (document.getElementById('lang-jp-mobile')) {
            document.getElementById('lang-jp-mobile').addEventListener('click', () => this.setLanguage('jp'));
        }
        if (document.getElementById('lang-en-mobile')) {
            document.getElementById('lang-en-mobile').addEventListener('click', () => this.setLanguage('en'));
        }
    }

    /**
     * 言語を設定
     * @param {string} lang 言語コード ('jp' または 'en')
     */
    setLanguage(lang) {
        if (lang !== 'jp' && lang !== 'en') {
            return;
        }
        
        this.currentLang = lang;
        document.documentElement.lang = lang === 'jp' ? 'ja' : 'en';
        
        // ローカルストレージに保存
        localStorage.setItem('language', lang);
        
        // 言語切替ボタンのアクティブ状態を更新
        document.querySelectorAll('.lang-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelectorAll(`[data-lang="${lang}"]`).forEach(button => {
            button.classList.add('active');
        });
        
        // 翻訳を適用
        this.translatePage();
        
        // オブザーバーに通知
        this.notifyObservers();
    }

    /**
     * 現在の言語を取得
     * @returns {string} 現在の言語コード
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * 翻訳を適用
     */
    translatePage() {
        // data-translateまたはdata-translate-placeholderを持つ要素を翻訳
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = this.translate(key);
            if (translation) {
                el.textContent = translation;
            }
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            const translation = this.translate(key);
            if (translation) {
                el.placeholder = translation;
            }
        });
    }

    /**
     * 翻訳テキストを取得
     * @param {string} key 翻訳キー
     * @param {...any} args 関数型翻訳用の引数
     * @returns {string} 翻訳テキスト
     */
    translate(key, ...args) {
        const translation = this.translations[this.currentLang][key];
        if (!translation) {
            return key;
        }
        if (typeof translation === 'function') {
            return translation(...args);
        }
        if (typeof translation === 'string') {
            return translation;
        }
        return key;
    }

    /**
     * 翻訳テキストを取得（プレースホルダー対応版）
     * @param {string} key 翻訳キー
     * @param {Object} params 置換パラメータ
     * @returns {string} 翻訳テキスト
     */
    translateWithParams(key, params = {}) {
        let translation = this.translations[this.currentLang][key];
        
        if (!translation) {
            return key;
        }
        
        // Replace placeholders with values
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });
        
        return translation;
    }

    /**
     * オブザーバーを追加
     * @param {Object} observer 通知を受け取るオブザーバー
     */
    addObserver(observer) {
        this.observers.push(observer);
    }

    /**
     * オブザーバーを削除
     * @param {Object} observer 削除するオブザーバー
     */
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index !== -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * すべてのオブザーバーに言語変更を通知
     */
    notifyObservers() {
        this.observers.forEach(observer => {
            if (observer.updateLanguage) {
                observer.updateLanguage(this.currentLang);
            }
        });
    }
}
