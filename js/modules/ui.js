/**
 * UI操作を管理するクラス
 */
export class UI {
    constructor() {
        this.hamburgerMenu = document.querySelector('.hamburger-menu');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.pages = document.querySelectorAll('.page');
    }
    
    /**
     * ナビゲーションとメニュー機能を初期化
     */
    initNavigation() {
        // ハンバーガーメニューのクリックイベント
        if (this.hamburgerMenu) {
            this.hamburgerMenu.addEventListener('click', () => {
                this.hamburgerMenu.classList.toggle('active');
                this.mobileMenu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        }
        
        // ページ切り替え
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                
                // ナビゲーションリンクのアクティブ状態を更新
                this.navLinks.forEach(l => l.classList.remove('active'));
                document.querySelectorAll(`.nav-link[data-page="${pageId}"]`).forEach(l => {
                    l.classList.add('active');
                });
                
                // ページの表示状態を更新
                this.pages.forEach(page => {
                    if (page.id === `${pageId}-page`) {
                        page.classList.add('active');
                    } else {
                        page.classList.remove('active');
                    }
                });
                
                // モバイルメニューを閉じる
                if (this.mobileMenu && this.mobileMenu.classList.contains('active')) {
                    this.mobileMenu.classList.remove('active');
                    this.hamburgerMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
                
                // ページトップにスクロール
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
}
