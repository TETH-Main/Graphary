import { ReportManager } from './reportManager.js'; // Import ReportManager

/**
 * カード表示を管理するクラス
 */
export class CardManager {
    /**
     * @param {HTMLElement} container カードを表示するコンテナ
     * @param {Object} dataService データサービス
     * @param {Object} languageManager 言語管理サービス
     * @param {Function} onTagClick タグクリック時のコールバック
     */
    constructor(container, dataService, languageManager, onTagClick) {
        this.container = container;
        this.dataService = dataService;
        this.languageManager = languageManager;
        this.onTagClick = onTagClick;
        this.lastRenderedCards = [];
        
        // モーダル要素
        this.modal = document.getElementById('formula-modal');
        this.modalContent = document.getElementById('modal-content');
        this.modalClose = document.getElementById('modal-close');
        this.modalOverlay = this.modal.querySelector('.modal-overlay');
        
        // 報告機能のマネージャーを初期化
        this.reportManager = new ReportManager(
            'https://script.google.com/macros/s/AKfycbxPe9aZViGDaMz1xDe03YeaqHanY7Z1F694f6LtegmOmTHzBqsdA9nl_RPJgkuCwI2V/exec', // Use the same GAS URL
            this.languageManager // Pass languageManager for translations
        );

        // モーダルイベントリスナー設定
        this.setupModalEvents();

        // モーダル表示/非表示時のコールバック
        this.onShowModal = null;
        this.onHideModal = null;
    }

    /**
     * カードを表示
     * @param {Array} cards 表示するカードの配列
     */
    renderCards(cards) {
        this.lastRenderedCards = cards;
        this.container.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            
            // カードクリックイベント
            cardElement.addEventListener('click', () => {
                this.showCardModal(card);
            });
            
            this.container.appendChild(cardElement);
        });
    }

    /**
     * モーダル関連のイベントリスナーを設定
     */
    setupModalEvents() {
        // 閉じるボタンクリック時
        this.modalClose.addEventListener('click', () => {
            this.hideModal();
        });
        
        // オーバーレイクリック時（モーダル外）
        this.modalOverlay.addEventListener('click', () => {
            this.hideModal();
        });
        
        // ESCキー押下時
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hideModal();
            }
            // Also close report modal if open
            if (e.key === 'Escape' && this.reportManager && this.reportManager.reportModal.classList.contains('active')) {
                this.reportManager.hideModal();
            }
        });

        // Use event delegation on modalContent for report icon clicks
        this.modalContent.addEventListener('click', (e) => {
            const reportIcon = e.target.closest('.report-icon');
            if (reportIcon) {
                e.stopPropagation();
                const currentCard = this.getCurrentlyDisplayedCard();
                if (currentCard) {
                    console.log("Report icon clicked for card ID:", currentCard.id);
                    this.reportManager.showModal(currentCard.id);
                } else {
                    console.error("Could not find card ID for reporting.");
                }
            }
        });
    }

    /**
     * カードモーダルを表示
     * @param {Object} card 表示するカードデータ
     */
    showCardModal(card) {
        // モーダル内容を作成
        this.modalContent.innerHTML = this.createModalContent(card);
        
        // モーダル内のコピーボタン設定
        const copyButton = this.modalContent.querySelector('.modal-copy-button');
        if (copyButton) {
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyFormulaToClipboard(card.formula, copyButton);
            });
        }
        
        // モーダル内のタグクリックイベント設定
        const tagElements = this.modalContent.querySelectorAll('.modal-formula-tag');
        tagElements.forEach(tagElement => {
            tagElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagId = tagElement.dataset.tagId;
                if (this.onTagClick && tagId) {
                    this.hideModal();
                    this.onTagClick(tagId);
                }
            });
        });
        
        // 旗アイコン（報告ボタン）のイベントリスナーは setupModalEvents で
        // イベントデリゲーションを使って処理するため、ここでは削除します。
        
        // モーダルを表示
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // スクロールを無効化
        
        // コールバック関数があれば実行
        if (this.onShowModal && typeof this.onShowModal === 'function') {
            this.onShowModal(card);
        }
    }

    /**
     * モーダルを非表示
     */
    hideModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = ''; // スクロールを有効化に戻す
        
        // コールバック関数があれば実行
        if (this.onHideModal && typeof this.onHideModal === 'function') {
            this.onHideModal();
        }
    }

    /**
     * モーダル内のコンテンツを生成
     * @param {Object} card カードデータ
     * @returns {string} モーダル内のHTML
     */
    createModalContent(card) {
        const title = this.dataService.getLocalizedTitle(card);
        let modalHTML = `
            <h2 class="modal-formula-title">${title}</h2>
            
            <div class="modal-formula-image">
                ${card.image_url ? `<img src="${card.image_url}" alt="${title}">` : '<div class="no-image">No Image</div>'}
                
                <!-- 数式タイプ -->
                ${this.createModalFormulaTypeHTML(card.formula_type)}
                
                <!-- 報告ボタン -->
                <button class="report-icon" title="${this.languageManager.translate('report')}">
                    <i class="fas fa-flag"></i>
                </button>
            </div>
            
            <!-- 数式 -->
            <div class="modal-formula-content">
                <div class="modal-formula-scroll-container">
                    <div class="modal-formula-text">${card.formula}</div>
                </div>
                <div class="modal-copy-button-container">
                    <button class="modal-copy-button" title="${this.languageManager.translate('copy')}">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            
            <!-- タグとID -->
            <div class="modal-tag-id-container">
                <div class="modal-formula-tags">
                    ${this.createModalTagsHTML(card.tags)}
                </div>
                <div class="modal-formula-id">ID: ${card.id}</div>
            </div>
        `;
        
        return modalHTML;
    }

    /**
     * モーダル内の数式タイプHTMLを生成
     * @param {Array} formulaTypes 数式タイプの配列
     * @returns {string} 数式タイプのHTML
     */
    createModalFormulaTypeHTML(formulaTypes) {
        if (!formulaTypes || formulaTypes.length === 0) {
            return '';
        }
        
        let html = '<div class="modal-image-type-container">';
        formulaTypes.forEach(type => {
            // Translate the type using languageManager
            const translatedType = this.languageManager.translate(type.toLowerCase());
            html += `<span class="modal-image-type-tag">${translatedType}</span>`;
        });
        html += '</div>';
        
        return html;
    }

    /**
     * モーダル内のタグHTMLを生成
     * @param {Array} tags タグの配列
     * @returns {string} タグのHTML
     */
    createModalTagsHTML(tags) {
        if (!tags || tags.length === 0) {
            return '';
        }
        
        let html = '';
        tags.forEach(tag => {
            const tagName = this.dataService.getLocalizedTagName(tag);
            html += `<span class="modal-formula-tag" data-tag-id="${tag.id}">${tagName}</span>`;
        });
        
        return html;
    }

    /**
     * カードをクリア
     */
    clearCards() {
        this.container.innerHTML = '';
    }

    /**
     * カード要素を作成
     * @param {Object} card カードデータ
     * @returns {HTMLElement} カード要素
     */
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'formula-card'; // Use new class name

        // カード左側（画像部分）
        const cardLeft = this.createCardLeftElement(card);

        // カード右側（情報部分）
        const cardRight = this.createCardRightElement(card);

        cardElement.appendChild(cardLeft);
        cardElement.appendChild(cardRight);

        // Add click listener for modal
        cardElement.addEventListener('click', (event) => {
            // Prevent modal opening if copy button or tag is clicked
            if (event.target.closest('.copy-button') || event.target.closest('.formula-tag')) {
                return;
            }
            this.showCardModal(card);
        });


        return cardElement;
    }

    /**
     * カード左側（画像部分）の要素を作成
     * @param {Object} card カードデータ
     * @returns {HTMLElement} カード左側要素
     */
    createCardLeftElement(card) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'formula-image'; // Use new class name

        if (card.image_url) {
            const img = document.createElement('img');
            img.src = card.image_url;
            const title = this.dataService.getLocalizedTitle(card);
            img.alt = title || `${this.languageManager.translate('formula')} ID: ${card.id}`;
            imageContainer.appendChild(img);
        } else {
            // Placeholder if no image
            imageContainer.style.backgroundColor = '#eaeaea'; // Simple placeholder style
            const placeholder = document.createElement('div');
            placeholder.style.padding = '20px';
            placeholder.style.textAlign = 'center';
            placeholder.textContent = 'No Image';
            imageContainer.appendChild(placeholder);
        }

        // 数式タイプを画像の右上に表示
        if (card.formula_type && Array.isArray(card.formula_type) && card.formula_type.length > 0) {
            const imageTypeContainer = document.createElement('div');
            imageTypeContainer.className = 'image-type-container'; // Use new class name

            card.formula_type.forEach(type => {
                if (!type) return;

                const typeTag = document.createElement('span');
                typeTag.className = 'image-type-tag'; // Use new class name
                // Translate the type using languageManager
                typeTag.textContent = this.languageManager.translate(type.toLowerCase());
                imageTypeContainer.appendChild(typeTag);
            });
            imageContainer.appendChild(imageTypeContainer);
        }

        return imageContainer;
    }

    /**
     * カード右側（情報部分）の要素を作成
     * @param {Object} card カードデータ
     * @returns {HTMLElement} カード右側要素
     */
    createCardRightElement(card) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'formula-info'; // Use new class name

        // タイトル（言語に応じて切り替え）
        const title = document.createElement('h3');
        title.className = 'formula-title'; // Use new class name
        title.textContent = this.dataService.getLocalizedTitle(card) || `${this.languageManager.translate('formula')} ${card.id}`;

        // 数式コンテンツ領域の作成
        const formulaContainer = this.createFormulaContainer(card); // Pass the whole card object

        // タグとID情報の作成
        const tagIdContainer = this.createTagsAndIdSection(card); // Pass the whole card object

        // 情報コンテナに要素を追加
        infoContainer.appendChild(title);
        infoContainer.appendChild(formulaContainer);
        infoContainer.appendChild(tagIdContainer);

        return infoContainer;
    }

    /**
     * 数式コンテナを作成 (Now part of the right section)
     * @param {Object} card カードデータ
     * @returns {HTMLElement} 数式コンテンツ要素
     */
    createFormulaContainer(card) {
        const formula = card.formula;
        // 数式コンテナ（スクロール可能な領域）
        const formulaScrollContainer = document.createElement('div');
        formulaScrollContainer.className = 'formula-scroll-container'; // Use new class name

        // 数式テキスト
        const formulaText = document.createElement('div');
        formulaText.className = 'formula-text'; // Use new class name
        formulaText.textContent = formula;

        formulaScrollContainer.appendChild(formulaText);

        // コピーボタンコンテナ（スクロール領域の外）
        const copyButtonContainer = document.createElement('div');
        copyButtonContainer.className = 'copy-button-container'; // Use new class name

        // コピーボタン
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button'; // Use new class name
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = this.languageManager.translate('copy');
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            this.copyFormulaToClipboard(formula, copyBtn);
        };
        copyButtonContainer.appendChild(copyBtn);


        // 数式コンテナ（スクロール領域とコピーボタンを含む）
        const formulaContentContainer = document.createElement('div');
        formulaContentContainer.className = 'formula-content'; // Use new class name
        formulaContentContainer.appendChild(formulaScrollContainer);
        formulaContentContainer.appendChild(copyButtonContainer);

        return formulaContentContainer;
    }

    /**
     * タグとIDのセクションを作成 (Now part of the right section)
     * @param {Object} card - 数式オブジェクト
     * @returns {HTMLElement} タグとID表示セクション
     * @private
     */
    createTagsAndIdSection(card) {
        const tagIdContainer = document.createElement('div');
        tagIdContainer.className = 'tag-id-container'; // Use new class name

        // タグ
        const tags = document.createElement('div');
        tags.className = 'formula-tags'; // Use new class name

        if (card.tags && card.tags.length > 0) {
            card.tags.forEach(tag => {
                if (!tag || !tag.id) return; // Ensure tag and tag.id exist

                const tagElement = document.createElement('div');
                tagElement.className = 'formula-tag'; // Use new class name

                // 言語に応じたタグ名を表示
                const localizedTagName = this.dataService.getLocalizedTagName(tag);
                tagElement.textContent = localizedTagName;
                tagElement.dataset.tagId = tag.id; // Store tag ID

                tagElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click event
                    if (this.onTagClick) {
                        this.onTagClick(tag.id); // Use the stored tag ID
                    }
                });

                tags.appendChild(tagElement);
            });
        } else {
            // Optional: Display a message if no tags
            // const noTagsMessage = document.createElement('div');
            // noTagsMessage.textContent = this.languageManager.translate('noTags');
            // tags.appendChild(noTagsMessage);
        }

        // ID（右下に小さく表示）
        const idElement = document.createElement('div');
        idElement.className = 'formula-id-small'; // Use new class name
        idElement.textContent = `ID: ${card.id}`;

        // タグとIDをコンテナに追加
        tagIdContainer.appendChild(tags);
        tagIdContainer.appendChild(idElement);

        return tagIdContainer;
    }

    /**
     * 数式をクリップボードにコピー
     * @param {string} formula コピーする数式
     * @param {HTMLElement} button コピーボタン
     */
    copyFormulaToClipboard(formula, button) {
        navigator.clipboard.writeText(formula)
            .then(() => {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.style.color = '#4CAF50';
                
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.style.color = '';
                }, 2000);
            })
            .catch(err => {
                console.error('コピーに失敗しました:', err);
                const originalIcon = '<i class="fas fa-copy"></i>'; // Store original icon
                button.innerHTML = '<i class="fas fa-times"></i>';
                button.style.color = '#F44336';
                
                setTimeout(() => {
                    button.innerHTML = originalIcon; // Restore original icon
                    button.style.color = '';
                }, 2000);
            });
    }

    /**
     * 言語変更時に既存のカードを再描画
     */
    updateLanguage() {
        if (this.lastRenderedCards.length > 0) {
            this.renderCards(this.lastRenderedCards);
        }
    }

    /**
     * 現在モーダルに表示されているカードを取得
     * @returns {Object|null} カードデータ
     */
    getCurrentlyDisplayedCard() {
        const idElement = this.modalContent.querySelector('.modal-formula-id');
        if (idElement && idElement.textContent) {
            const idMatch = idElement.textContent.match(/ID:\s*(\S+)/);
            if (idMatch && idMatch[1]) {
                const id = idMatch[1];
                // Find the card in the last rendered list (more reliable than querying all cards)
                return this.lastRenderedCards.find(card => card.id === id);
            }
        }
        console.warn("Could not extract card ID from modal content.");
        return null;
    }
}
