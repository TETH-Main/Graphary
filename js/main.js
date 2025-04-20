import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { firebaseConfig } from './firebase-config.js'; // Import config
import { UI } from './modules/ui.js';
import { DataService } from './modules/dataService.js';
import { CardManager } from './modules/cardManager.js';
import { PaginationManager } from './modules/paginationManager.js';
import { LanguageManager } from './modules/languageManager.js';
import { RegisterManager } from './modules/registerManager.js';
import { UrlUtils } from './modules/UrlUtils.js';

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// 現在の年を設定
document.querySelectorAll("#currentYear").forEach(el => {
    el.textContent = new Date().getFullYear();
});

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize language manager
    const languageManager = new LanguageManager();
    languageManager.init();
    
    // Initialize tag list globally
    window.tagsList = [];
    
    try {
        // Fetch initial tags data
        const response = await fetch('https://script.google.com/macros/s/AKfycbxoIgrjXYJ6tgvqoy83LWTFP61SZhm_UGgMZ4oJlLrwWUZrj1yPhOtZS6ocr1_mFoNW/exec?id=139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM&name=tagsList');
        
        if (response.ok) {
            const tagsList = await response.json();
            if (tagsList && Array.isArray(tagsList)) {
                window.tagsList = tagsList;
            }
        }
    } catch (error) {
        console.error('Failed to load tags list:', error);
    }
    
    // Initialize register manager and connect language manager
    const registerManager = new RegisterManager();
    registerManager.setLanguageManager(languageManager);
    
    // Initialize other components...
    
    // モジュールのインスタンス化
    const ui = new UI();
    const dataService = new DataService(db);
    
    // カードマネージャーとページネーションマネージャーの作成
    const cardManager = new CardManager(
        document.getElementById('cards-container'),
        dataService,
        languageManager,
        (tagId) => handleTagClick(tagId)
    );
    
    const paginationManager = new PaginationManager(
        document.getElementById('pagination'),
        () => {
            renderCurrentPage();
            // ページ変更時にURLを更新
            const params = UrlUtils.getQueryParams();
            params.page = paginationManager.getCurrentPage();
            UrlUtils.setQueryParams(params);
        },
        languageManager
    );
    
    // 言語マネージャーにオブザーバーとして登録
    languageManager.addObserver({
        updateLanguage: (lang) => {
            dataService.setLanguage(lang);

            // タグフィルターと言語タイプフィルターを再構築して言語を反映
            initializeTagsFilter();
            initializeFormulaTypesFilter(); // Add this line

            cardManager.updateLanguage();
            renderCurrentPage();
        }
    });
    
    // ナビゲーションとメニュー初期化
    ui.initNavigation();
    
    // 1ページあたりの表示件数設定
    const itemsPerPageSelect = document.getElementById('items-per-page');
    paginationManager.setItemsPerPage(parseInt(itemsPerPageSelect.value));
    
    // 検索と絞り込み用の要素
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear');
    const sortOption = document.getElementById('sort-option');
    const tagsFilterContainer = document.getElementById('tags-filter');
    const formulaTypesContainer = document.getElementById('formula-types-filter');
    const activeFiltersContainer = document.getElementById('active-filters');
    const loader = document.getElementById('loader');
    const noResults = document.getElementById('no-results');
    
    // アクティブなタグとタイプを追跡するマップ
    const tagButtons = new Map();
    const typeButtons = new Map();
    
    // データの読み込みと初期表示
    async function initialize() {
        try {
            // URLからクエリパラメータを取得
            const params = UrlUtils.getQueryParams();
            
            // タグデータ読み込み
            await dataService.loadTags();
            
            // タグフィルター初期化
            initializeTagsFilter();
            
            // 数式カードデータ読み込み
            await dataService.loadFormulaCards();
            
            // 数式タイプフィルター初期化
            initializeFormulaTypesFilter();
            
            // イベントリスナー設定
            setupEventListeners();
            
            // URLパラメータに基づいて初期状態を設定
            applyUrlParameters(params);
            
            // 最初のページを表示（applyUrlParameters後に呼び出す）
            renderCurrentPage();
            
            // formulaIdが指定されている場合、対応するカードをモーダルで表示
            if (params.formulaId) {
                const card = dataService.getCardById(params.formulaId);
                if (card) {
                    // モーダル表示前にURLから一旦formulaIdを削除して、モーダルを閉じたときにパラメータが残らないようにする
                    UrlUtils.clearFormulaId();
                    setTimeout(() => {
                        cardManager.showCardModal(card);
                    }, 500); // 少し遅延させて他の初期化が終わってからモーダルを表示
                }
            }
            
            // ローダーを非表示
            loader.style.display = 'none';
        } catch (error) {
            console.error('初期化エラー:', error);
            loader.innerHTML = '<p>データの読み込みに失敗しました。</p>';
        }
    }
    
    // URLパラメータを適用する
    function applyUrlParameters(params) {
        // ソート順を設定
        sortOption.value = params.sort;
        dataService.setSortOption(params.sort);
        
        // 1ページあたりの表示件数を設定
        itemsPerPageSelect.value = params.items;
        paginationManager.setItemsPerPage(params.items);
        
        // 検索テキストを設定
        searchInput.value = params.search;
        updateSearchClearButton();
        dataService.setFilters({ search: params.search });
        
        // タグフィルターを設定
        if (params.tags && params.tags.length > 0) {
            params.tags.forEach(tagId => {
                dataService.addTagFilter(tagId);
                // タグボタンがあれば選択状態にする
                const tagButton = tagButtons.get(tagId);
                if (tagButton) {
                    tagButton.classList.add('active');
                }
            });
        }
        
        // 数式タイプフィルターを設定
        if (params.formulaType) {
            dataService.setFilters({ formulaType: params.formulaType });
            // タイプボタンがあれば選択状態にする
            const typeButton = typeButtons.get(params.formulaType);
            if (typeButton) {
                typeButton.classList.add('active');
            }
        }
        
        // アクティブフィルターの表示を更新
        updateActiveFilters();
        
        // ※ここを変更: changePage から setCurrentPage に変更
        // フィルタリングが適用された後にページ番号を設定
        paginationManager.setCurrentPage(params.page);
    }
    
    // タグフィルターの初期化
    function initializeTagsFilter() {
        tagsFilterContainer.innerHTML = '';
        tagButtons.clear();
        
        // タグをアルファベット順に並べ替え
        const sortedTags = Object.entries(dataService.tagsMap).sort((a, b) => {
            const nameA = languageManager.getCurrentLanguage() === 'en' && a[1].tagName_EN ? a[1].tagName_EN : a[1].tagName;
            const nameB = languageManager.getCurrentLanguage() === 'en' && b[1].tagName_EN ? b[1].tagName_EN : b[1].tagName;
            return nameA.localeCompare(nameB);
        });
        
        sortedTags.forEach(([tagId, tagData]) => {
            const tagButton = document.createElement('span');
            tagButton.className = 'filter-tag';
            tagButton.textContent = dataService.getLocalizedTagName({
                tagName: tagData.tagName,
                tagName_EN: tagData.tagName_EN
            });
            tagButton.dataset.tagId = tagId;
            
            tagButton.addEventListener('click', () => {
                handleTagClick(tagId);
            });
            
            tagButtons.set(tagId, tagButton);
            tagsFilterContainer.appendChild(tagButton);
        });
    }
    
    // 数式タイプフィルターの初期化
    function initializeFormulaTypesFilter() {
        formulaTypesContainer.innerHTML = '';
        typeButtons.clear();
        
        const formulaTypes = dataService.getFormulaTypes();
        
        formulaTypes.forEach(type => {
            const typeButton = document.createElement('span');
            typeButton.className = 'type-tag';
            // Translate the type name using languageManager
            typeButton.textContent = languageManager.translate(type.toLowerCase()); // Use lowercase key
            typeButton.dataset.type = type;
            
            typeButton.addEventListener('click', () => {
                handleFormulaTypeClick(type);
            });
            
            typeButtons.set(type, typeButton);
            formulaTypesContainer.appendChild(typeButton);
        });
    }
    
    // イベントリスナー設定
    function setupEventListeners() {
        // 検索機能
        searchInput.addEventListener('input', () => {
            updateSearchClearButton();
            const searchValue = searchInput.value;
            dataService.setFilters({ search: searchValue });
            paginationManager.changePage(1);
            updateUI();
            
            // URL更新
            const params = UrlUtils.getQueryParams();
            params.search = searchValue;
            params.page = 1;
            UrlUtils.setQueryParams(params);
        });
        
        // 検索クリアボタン
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            updateSearchClearButton();
            dataService.setFilters({ search: '' });
            paginationManager.changePage(1);
            updateUI();
            
            // URL更新
            const params = UrlUtils.getQueryParams();
            params.search = '';
            params.page = 1;
            UrlUtils.setQueryParams(params);
        });
        
        // 初期状態では検索クリアボタンは非表示
        updateSearchClearButton();
        
        // ソートオプション
        sortOption.addEventListener('change', () => {
            const sortValue = sortOption.value;
            dataService.setSortOption(sortValue);
            updateUI();
            
            // URL更新
            const params = UrlUtils.getQueryParams();
            params.sort = sortValue;
            UrlUtils.setQueryParams(params);
        });
        
        // 表示件数変更
        itemsPerPageSelect.addEventListener('change', () => {
            const itemsValue = parseInt(itemsPerPageSelect.value);
            paginationManager.setItemsPerPage(itemsValue);
            updateUI();
            
            // URL更新
            const params = UrlUtils.getQueryParams();
            params.items = itemsValue;
            params.page = 1; // 件数変更時は1ページ目に戻る
            UrlUtils.setQueryParams(params);
        });
        
        // カードマネージャーにモーダル表示/非表示時のイベントハンドラを追加
        cardManager.onShowModal = (card) => {
            // モーダル表示時にURLにformulaIdを追加
            if (card && card.id) {
                UrlUtils.setFormulaId(card.id);
            }
        };
        
        cardManager.onHideModal = () => {
            // モーダル非表示時にURLからformulaIdを削除
            UrlUtils.clearFormulaId();
        };
        
        // ブラウザの戻る/進むボタン対応
        window.addEventListener('popstate', () => {
            const params = UrlUtils.getQueryParams();
            applyUrlParameters(params);
            renderCurrentPage();
            
            // formulaIdが指定されている場合、対応するカードをモーダルで表示
            if (params.formulaId) {
                const card = dataService.getCardById(params.formulaId);
                if (card) {
                    cardManager.showCardModal(card);
                }
            }
        });
    }
    
    // 検索クリアボタンの表示/非表示を更新
    function updateSearchClearButton() {
        searchClearBtn.style.display = searchInput.value ? 'block' : 'none';
    }
    
    // タグクリックハンドラー
    function handleTagClick(tagId) {
        const activeFilters = dataService.getActiveFilters();
        const isTagActive = activeFilters.tags.includes(tagId);
        
        if (isTagActive) {
            dataService.removeTagFilter(tagId);
        } else {
            dataService.addTagFilter(tagId);
        }
        
        paginationManager.changePage(1);
        updateUI();
        
        // URL更新
        const params = UrlUtils.getQueryParams();
        params.tags = dataService.getActiveFilters().tags;
        params.page = 1; // タグ変更時は1ページ目に戻る
        UrlUtils.setQueryParams(params);
    }
    
    // 数式タイプクリックハンドラー
    function handleFormulaTypeClick(type) {
        const activeFilters = dataService.getActiveFilters();
        
        if (activeFilters.formulaType === type) {
            dataService.setFilters({ formulaType: '' });
        } else {
            dataService.setFilters({ formulaType: type });
        }
        
        paginationManager.changePage(1);
        updateUI();
        
        // URL更新
        const params = UrlUtils.getQueryParams();
        params.formulaType = dataService.getActiveFilters().formulaType;
        params.page = 1; // タイプ変更時は1ページ目に戻る
        UrlUtils.setQueryParams(params);
    }
    
    // フィルター削除ハンドラー
    function handleRemoveFilter(filterId) {
        if (filterId === 'search') {
            searchInput.value = '';
            updateSearchClearButton();
            dataService.setFilters({ search: '' });
        } else if (filterId === 'formula-type') {
            dataService.setFilters({ formulaType: '' });
        } else if (filterId.startsWith('tag-')) {
            const tagId = filterId.substring(4);
            dataService.removeTagFilter(tagId);
        }
        
        paginationManager.changePage(1);
        updateUI();
        
        // URL更新
        const params = UrlUtils.getQueryParams();
        params.search = dataService.getActiveFilters().search;
        params.tags = dataService.getActiveFilters().tags;
        params.formulaType = dataService.getActiveFilters().formulaType;
        params.page = 1;
        UrlUtils.setQueryParams(params);
    }
    
    // すべてのフィルターをクリア
    function handleClearAllFilters() {
        searchInput.value = '';
        updateSearchClearButton();
        dataService.clearFilters();
        
        paginationManager.changePage(1);
        updateUI();
        
        // URL更新 - フィルターをクリアするのでシンプルに置き換え
        UrlUtils.setQueryParams({});
    }
    
    // アクティブフィルターを更新
    function updateActiveFilters() {
        const activeFiltersData = dataService.getActiveFilters();
        activeFiltersContainer.innerHTML = '';
        
        let hasActiveFilters = false;
        
        // 検索キーワード
        if (activeFiltersData.search) {
            hasActiveFilters = true;
            const searchLabel = languageManager.translate('keyword-search'); // Use correct key
            appendActiveFilter(`${searchLabel}: ${activeFiltersData.search}`, 'search');
        }
        
        // タグフィルター
        activeFiltersData.tags.forEach(tagId => {
            hasActiveFilters = true;
            const tagData = dataService.tagsMap[tagId];
            const tagName = dataService.getLocalizedTagName({
                tagName: tagData?.tagName || '不明なタグ',
                tagName_EN: tagData?.tagName_EN
            });
            const tagLabel = languageManager.translate('tag-search');
            appendActiveFilter(`${tagLabel}: ${tagName}`, `tag-${tagId}`);
        });
        
        // 数式タイプフィルター
        if (activeFiltersData.formulaType) {
            hasActiveFilters = true;
            const typeLabel = languageManager.translate('formula-type-search');
            // Translate the active formula type
            const translatedType = languageManager.translate(activeFiltersData.formulaType.toLowerCase()); // Use lowercase key
            appendActiveFilter(`${typeLabel}: ${translatedType}`, 'formula-type');
        }
        
        // アクティブフィルターが存在する場合、クリアボタンを追加
        if (hasActiveFilters) {
            const clearAllBtn = document.createElement('button');
            clearAllBtn.className = 'clear-all-filters';
            clearAllBtn.textContent = languageManager.translate('clearAll');
            clearAllBtn.addEventListener('click', handleClearAllFilters);
            activeFiltersContainer.appendChild(clearAllBtn);
            
            activeFiltersContainer.style.display = 'flex';
        } else {
            activeFiltersContainer.style.display = 'none';
        }
        
        // タグボタンのアクティブ状態を更新
        updateTagButtonStates(activeFiltersData.tags);
        
        // 数式タイプボタンのアクティブ状態を更新
        updateTypeButtonStates(activeFiltersData.formulaType);
    }
    
    // アクティブフィルターを追加
    function appendActiveFilter(text, filterId) {
        const filterDiv = document.createElement('div');
        filterDiv.className = 'active-filter';
        filterDiv.innerHTML = `
            <span>${text}</span>
            <span class="remove-filter" data-filter-id="${filterId}">×</span>
        `;
        
        filterDiv.querySelector('.remove-filter').addEventListener('click', (e) => {
            e.stopPropagation();
            handleRemoveFilter(filterId);
        });
        
        activeFiltersContainer.appendChild(filterDiv);
    }
    
    // タグボタンのアクティブ状態を更新
    function updateTagButtonStates(activeTags) {
        tagButtons.forEach((button, tagId) => {
            if (activeTags.includes(tagId)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // 数式タイプボタンのアクティブ状態を更新
    function updateTypeButtonStates(activeType) {
        typeButtons.forEach((button, type) => {
            if (type === activeType) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // 現在のページを表示
    function renderCurrentPage() {
        const filteredCards = dataService.filterCards();
        
        // ページネーション情報を更新
        paginationManager.setTotalItems(filteredCards.length);
        
        // 表示するカードが0件の場合
        if (filteredCards.length === 0) {
            cardManager.clearCards();
            noResults.style.display = 'block';
            paginationManager.render();
            return;
        }
        
        noResults.style.display = 'none';
        
        // 現在のページに表示するカードを抽出
        const { startIndex, endIndex } = paginationManager.getItemRange();
        const cardsToShow = filteredCards.slice(startIndex, endIndex);
        
        // カードを表示
        cardManager.renderCards(cardsToShow);
        
        // ページネーションを表示
        paginationManager.render();
    }
    
    // UI全体を更新
    function updateUI() {
        updateActiveFilters();
        renderCurrentPage();
    }
    
    // アプリケーション初期化実行
    initialize();
});
