/**
 * データ取得と処理を担当するサービスクラス
 */
class DataService {
    /**
     * DataServiceのコンストラクタ
     */
    constructor() {
        this.formulas = [];
        this.tags = new Set();
        this.formulaTypes = new Set(); // 数式タイプを保存するセット
        this.dataLoadedCallback = null;
        this.dataLoaded = false;
        this.tagMapping = {}; // タグIDと名前のマッピング
        this.tagNameToId = {}; // タグ名からIDへのマッピング
    }

    /**
     * Google Spreadsheetからデータを取得
     * @returns {Promise<boolean>} 成功したらtrue、失敗したらfalse
     */
    async fetchData() {
        try {
            // タグリストを先に取得
            await this.fetchTagsList();

            const url = 'https://script.google.com/macros/s/AKfycbxoIgrjXYJ6tgvqoy83LWTFP61SZhm_UGgMZ4oJlLrwWUZrj1yPhOtZS6ocr1_mFoNW/exec?id=139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM&name=data';

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // データの処理
            this.processData(data);
            this.dataLoaded = true;
            if (this.dataLoadedCallback) {
                this.dataLoadedCallback();
            }
            return true;
        } catch (error) {
            console.error('Error fetching data:', error);
            return false;
        }
    }

    /**
     * タグリストを取得する
     * @returns {Promise<boolean>} 成功したらtrue、失敗したらfalse
     */
    async fetchTagsList() {
        try {
            const url = 'https://script.google.com/macros/s/AKfycbxoIgrjXYJ6tgvqoy83LWTFP61SZhm_UGgMZ4oJlLrwWUZrj1yPhOtZS6ocr1_mFoNW/exec?id=139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM&name=tagsList';

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tagsList = await response.json();

            if (!tagsList || !Array.isArray(tagsList) || tagsList.length === 0) {
                return false;
            }

            // タグIDと名前のマッピングを作成
            tagsList.forEach(tag => {
                if (!tag.tagID) {
                    return;
                }
                
                const tagId = tag.tagID.toString();
                this.tagMapping[tagId] = {
                    name: tag.tagName || '',
                    name_EN: tag.tagName_EN || ''
                };

                // タグ名からIDへのマッピングも作成
                if (tag.tagName) {
                    this.tagNameToId[tag.tagName] = tagId;
                }
                if (tag.tagName_EN) {
                    this.tagNameToId[tag.tagName_EN] = tagId;
                }
            });
            return true;
        } catch (error) {
            console.error('Error fetching tags list:', error);
            return false;
        }
    }

    /**
     * 取得したデータを処理
     * @param {Array} data - APIから取得したデータ
     */
    processData(data) {
        // データ形式に応じて処理を変更
        // データがnullや空の場合の処理
        if (!data || data.length === 0) {
            return;
        }
        
        // Formulaオブジェクトに変換する前にデータの正規化
        const normalizedData = data.map(entry => {
            // データのディープコピーを作成して元のデータを変更しないようにする
            const normalizedEntry = {...entry};
            
            // formula_typeとformula_typeの両方が存在しない場合の対応
            if (!normalizedEntry.formula_type && !normalizedEntry.formulaType) {
                // 警告は削除
            }
            
            // image_urlとimageUrlの両方が存在しない場合の対応
            if (!normalizedEntry.image_url && !normalizedEntry.imageUrl) {
                // 警告は削除
            }
            
            return normalizedEntry;
        });
        
        // Formulaオブジェクトに変換
        this.formulas = normalizedData.map(entry => {
            const formula = Formula.fromSpreadsheetEntry(entry);
            
            // タグIDをタグ名に変換
            if (Array.isArray(formula.tags)) {
                // タグIDが数値の場合、タグ名に変換
                const convertedTags = formula.tags.map(tag => {
                    // タグがIDの場合（数値または数値文字列）
                    if (tag && !isNaN(tag)) {
                        const tagName = this.getTagNameById(tag);
                        return tagName || tag; // タグ名がない場合は元のIDを使用
                    }
                    return tag; // すでにタグ名の場合はそのまま
                });
                
                // 変換されたタグ名をセット
                formula.tags = convertedTags.filter(tag => tag); // 空のタグを除外
                
                // 元のタグIDも保持
                formula.tagIds = entry.tags.split(',').map(tag => tag.trim());
            }
            
            return formula;
        });

        // すべてのタグを収集
        this.collectTags();
        
        // すべての数式タイプを収集
        this.collectFormulaTypes();
    }

    /**
     * タグIDからタグ名を取得
     * @param {string} id - タグID
     * @param {boolean} [useEnglish=false] - 英語名を使用するかどうか
     * @returns {string} タグ名
     */
    getTagNameById(id, useEnglish = false) {
        if (!id) return '';

        const tag = this.tagMapping[id];
        if (!tag) return '';

        return useEnglish && tag.name_EN ? tag.name_EN : tag.name;
    }

    /**
     * タグ名からタグIDを取得
     * @param {string} name - タグ名
     * @returns {string} タグID
     */
    getTagIdByName(name) {
        return this.tagNameToId[name] || '';
    }

    /**
       * すべての数式からタグを収集
       */
    collectTags() {
        this.tags.clear();
        
        this.formulas.forEach(formula => {
            // 数式のタグを処理
            if (Array.isArray(formula.tags)) {
                formula.tags.forEach(tagId => {
                    // タグIDの場合はタグ名に変換
                    if (tagId && !isNaN(tagId)) {
                        const tagName = this.getTagNameById(tagId);
                        if (tagName) {
                            this.tags.add(tagName);
                        }
                    } else if (tagId) {
                        // すでにタグ名の場合はそのまま追加
                        this.tags.add(tagId);
                    }
                });
            } else if (formula.tagIds) {
                // 別形式: tagIdsプロパティからタグを収集
                formula.tagIds.forEach(tagId => {
                    const tagName = this.getTagNameById(tagId);
                    if (tagName) {
                        this.tags.add(tagName);
                    }
                });
            }
        });
    }

    /**
     * すべての数式から数式タイプを収集
     */
    collectFormulaTypes() {
        this.formulaTypes.clear();
        
        this.formulas.forEach(formula => {
            if (formula.formulaType) {
                // カンマで区切られた複数のタイプを処理
                const types = formula.formulaType.split(',').map(type => type.trim());
                types.forEach(type => {
                    if (type) {
                        this.formulaTypes.add(type);
                    }
                });
            }
        });
    }

    /**
     * 数式を指定された条件でソート
     * @param {Array} formulas - ソートする数式の配列
     * @param {string} sortOption - ソートオプション
     * @returns {Array} ソートされた数式の配列
     */
    sortFormulas(formulas, sortOption) {
        const sortedFormulas = [...formulas];

        switch (sortOption) {
            case 'id-asc': // ID昇順
                sortedFormulas.sort((a, b) => a.id - b.id);
                break;
            case 'id-desc': // ID降順
                sortedFormulas.sort((a, b) => b.id - a.id);
                break;
            case 'type-asc': // タイプ昇順
                sortedFormulas.sort((a, b) => a.formulaType.localeCompare(b.formulaType));
                break;
            case 'type-desc': // タイプ降順
                sortedFormulas.sort((a, b) => b.formulaType.localeCompare(a.formulaType));
                break;
        }

        return sortedFormulas;
    }

    /**
     * すべての数式タイプを取得
     * @returns {Array} 数式タイプの配列
     */
    getAllFormulaTypes() {
        return Array.from(this.formulaTypes).sort();
    }

    /**
     * すべてのタグを取得
     * @returns {Array} タグの配列
     */
    getAllTags() {
        return Array.from(this.tags).sort();
    }

    /**
     * 言語に基づいたタグ名を取得 (UIController向け)
     * @param {string} tagName - 日本語のタグ名
     * @param {string} lang - 言語コード ('ja' or 'en')
     * @returns {string} 指定された言語のタグ名
     */
    getLocalizedTagName(tagName, lang) {
        if (lang !== 'en') return tagName;

        // タグ名からIDを取得
        const tagId = this.getTagIdByName(tagName);
        if (!tagId || !this.tagMapping[tagId]) return tagName;

        // 英語名が存在すれば返す、なければ日本語名
        return this.tagMapping[tagId].name_EN || this.tagMapping[tagId].name;
    }

    /**
     * データがロードされたときに呼び出されるコールバック関数を設定
     * @param {Function} callback - コールバック関数
     */
    setDataLoadedCallback(callback) {
        this.dataLoadedCallback = callback;
        if (this.dataLoaded) {
            callback();
        }
    }

    /**
     * データがロードされるまで待つ
     * @returns {Promise<void>}
     */
    waitForDataLoad() {
        return new Promise((resolve) => {
            if (this.dataLoaded) {
                resolve();
            } else {
                this.setDataLoadedCallback(resolve);
            }
        });
    }

    /**
     * IDで数式を取得
     * @param {string|number} id - 数式ID
     * @returns {Formula|null} 見つかった数式、または見つからない場合はnull
     */
    getFormulaById(id) {
        if (!id) return null;
        return this.formulas.find(formula => formula.id.toString() === id.toString()) || null;
    }
}
