import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

/**
 * データ取得とフィルタリングを担当するサービスクラス
 */
export class DataService {
    /**
     * @param {Firestore} db Firestoreデータベース
     */
    constructor(db) {
        this.db = db;
        this.formulaCards = [];
        this.tagsMap = {};
        this.filteredCards = [];
        this.formulaTypes = new Set();
        this.activeFilters = {
            search: '',
            tags: [],
            formulaType: ''
        };
        this.sortOption = 'id-asc'; // デフォルトの並び順
        this.currentLang = 'jp';
    }

    /**
     * タグデータを読み込む
     * @returns {Promise<Object>} タグデータのマップ
     */
    async loadTags() {
        const tagsQuery = query(collection(this.db, "tagsList"));
        const tagsSnapshot = await getDocs(tagsQuery);
        
        tagsSnapshot.forEach(doc => {
            const tagData = doc.data();
            this.tagsMap[doc.id] = {
                tagName: tagData.tagName,
                tagName_EN: tagData.tagName_EN
            };
        });
        
        return this.tagsMap;
    }

    /**
     * 数式カードのデータを読み込む
     * @returns {Promise<Array>} 数式カードの配列
     */
    async loadFormulaCards() {
        const itemsQuery = query(collection(this.db, "items"));
        const itemsSnapshot = await getDocs(itemsQuery);
        
        itemsSnapshot.forEach(doc => {
            const data = doc.data();
            
            // タグ情報をマージ（tagsはnumberの配列）
            const tagDetails = [];
            if (data.tags && Array.isArray(data.tags)) {
                for (const tagNumber of data.tags) {
                    const tagId = String(tagNumber); // 数値を文字列に変換
                    if (this.tagsMap[tagId]) {
                        tagDetails.push({
                            id: tagId,
                            tagName: this.tagsMap[tagId].tagName,
                            tagName_EN: this.tagsMap[tagId].tagName_EN
                        });
                    }
                }
            }
            
            // formula_typeの安全な処理
            let formulaTypes = [];
            if (data.formula_type) {
                if (typeof data.formula_type === 'string') {
                    formulaTypes = data.formula_type.split(',').map(type => type.trim());
                } else if (Array.isArray(data.formula_type)) {
                    formulaTypes = data.formula_type;
                }
            }
            
            // 数式タイプをSetに追加
            formulaTypes.forEach(type => {
                if (type) this.formulaTypes.add(type);
            });
            
            // カードデータを作成
            this.formulaCards.push({
                id: data.id,
                formula: data.formula,
                title: data.title,
                title_EN: data.title_EN,
                image_url: data.image_url,
                tags: tagDetails,
                formula_type: formulaTypes,
                raw_tags: data.tags || []
            });
        });
        
        // カードをID順にソート
        this.sortCards();
        
        return this.formulaCards;
    }

    /**
     * 利用可能な数式タイプを取得
     * @returns {Array<string>} 数式タイプの配列
     */
    getFormulaTypes() {
        return [...this.formulaTypes].sort();
    }

    /**
     * 検索条件に基づいてカードをフィルタリング
     * @returns {Array} フィルタリングされたカード配列
     */
    filterCards() {
        this.filteredCards = this.formulaCards.filter(card => {
            // 検索キーワードとの一致をチェック
            const matchesSearch = !this.activeFilters.search || 
                card.title?.toLowerCase().includes(this.activeFilters.search.toLowerCase()) ||
                card.title_EN?.toLowerCase().includes(this.activeFilters.search.toLowerCase()) ||
                card.formula?.toLowerCase().includes(this.activeFilters.search.toLowerCase());
            
            // アクティブなタグフィルターとの一致をチェック
            let matchesTags = true;
            if (this.activeFilters.tags.length > 0) {
                matchesTags = card.tags.some(tag => this.activeFilters.tags.includes(tag.id));
            }
            
            // 数式タイプとの一致をチェック
            const matchesFormulaType = !this.activeFilters.formulaType || 
                card.formula_type.includes(this.activeFilters.formulaType);
            
            return matchesSearch && matchesTags && matchesFormulaType;
        });
        
        // ソート適用
        this.sortFilteredCards();
        
        return this.filteredCards;
    }

    /**
     * フィルターを設定
     * @param {Object} filters 設定するフィルター
     */
    setFilters(filters) {
        if (filters.search !== undefined) {
            this.activeFilters.search = filters.search;
        }
        
        if (filters.tags !== undefined) {
            this.activeFilters.tags = filters.tags;
        }
        
        if (filters.formulaType !== undefined) {
            this.activeFilters.formulaType = filters.formulaType;
        }
    }

    /**
     * タグフィルターの追加
     * @param {string} tagId 追加するタグID
     */
    addTagFilter(tagId) {
        if (!this.activeFilters.tags.includes(tagId)) {
            this.activeFilters.tags.push(tagId);
        }
    }

    /**
     * タグフィルターの削除
     * @param {string} tagId 削除するタグID
     */
    removeTagFilter(tagId) {
        this.activeFilters.tags = this.activeFilters.tags.filter(id => id !== tagId);
    }

    /**
     * 現在のフィルターを取得
     * @returns {Object} 現在のフィルター
     */
    getActiveFilters() {
        return {
            search: this.activeFilters.search,
            tags: this.activeFilters.tags,
            formulaType: this.activeFilters.formulaType
        };
    }

    /**
     * フィルターをクリア
     */
    clearFilters() {
        this.activeFilters = {
            search: '',
            tags: [],
            formulaType: ''
        };
    }

    /**
     * ソートオプションを設定
     * @param {string} option ソートオプション
     */
    setSortOption(option) {
        this.sortOption = option;
    }

    /**
     * カードをソート
     */
    sortCards() {
        this.formulaCards = this.applySorting(this.formulaCards);
    }

    /**
     * フィルタリングされたカードをソート
     */
    sortFilteredCards() {
        this.filteredCards = this.applySorting(this.filteredCards);
    }

    /**
     * ソートを適用
     * @param {Array} cards ソートするカード配列
     * @returns {Array} ソートされたカード配列
     */
    applySorting(cards) {
        switch(this.sortOption) {
            case 'id-asc':
                // Compare IDs numerically
                return [...cards].sort((a, b) => a.id - b.id);
            case 'id-desc':
                // Compare IDs numerically
                return [...cards].sort((a, b) => b.id - a.id);
            case 'type-asc':
                return [...cards].sort((a, b) => {
                    const typeA = a.formula_type[0] || '';
                    const typeB = b.formula_type[0] || '';
                    return typeA.localeCompare(typeB);
                });
            case 'type-desc':
                return [...cards].sort((a, b) => {
                    const typeA = a.formula_type[0] || '';
                    const typeB = b.formula_type[0] || '';
                    return typeB.localeCompare(typeA);
                });
            default:
                // Default sort by ID ascending (numeric)
                return [...cards].sort((a, b) => a.id - b.id);
        }
    }

    /**
     * タグIDに対応するタグ名を取得
     * @param {string} tagId タグID
     * @returns {string} タグ名
     */
    getTagName(tagId) {
        return this.tagsMap[tagId]?.tagName || '不明なタグ';
    }

    /**
     * 言語を設定
     * @param {string} lang 言語コード
     */
    setLanguage(lang) {
        this.currentLang = lang;
    }

    /**
     * 現在の言語でタグ名を取得
     * @param {Object} tag タグオブジェクト
     * @returns {string} タグ名
     */
    getLocalizedTagName(tag) {
        if (this.currentLang === 'en' && tag.tagName_EN) {
            return tag.tagName_EN;
        }
        return tag.tagName || '不明なタグ';
    }

    /**
     * 現在の言語でカードタイトルを取得
     * @param {Object} card カードオブジェクト
     * @returns {string} カードタイトル
     */
    getLocalizedTitle(card) {
        if (this.currentLang === 'en' && card.title_EN) {
            return card.title_EN;
        }
        return card.title || '';
    }

    /**
     * IDに基づいて特定のカードを取得
     * @param {string|number} id カードID (can be string or number from URL/internal use)
     * @returns {Object|null} 見つかったカードまたはnull
     */
    getCardById(id) {
        // Convert incoming id to number for comparison, as Firestore IDs are now numbers
        const numericId = Number(id);
        return this.formulaCards.find(card => card.id === numericId) || null;
    }
}
