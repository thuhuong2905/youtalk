/**
 * Pagination Utilities - Component tái sử dụng cho phân trang
 * 
 * Mục đích: Cung cấp logic phân trang nhất quán cho cả admin panel và user pages
 * Features:
 * - Responsive pagination với ellipsis (...)
 * - Customizable styling
 * - Event handling
 * - Keyboard navigation support
 */

class PaginationUtils {
    constructor() {
        this.defaultConfig = {
            maxVisiblePages: 5,
            showFirstLast: true,
            showPrevNext: true,
            prevText: '←',
            nextText: '→',
            firstText: '1',
            lastText: null, // Will be set to totalPages
            ellipsisText: '...',
            containerClass: 'pagination',
            buttonClass: 'pagination-btn',
            activeClass: 'active',
            disabledClass: 'disabled',
            ellipsisClass: 'pagination-ellipsis'
        };
    }

    /**
     * Tạo HTML cho pagination
     * @param {Object} options - Cấu hình pagination
     * @param {number} options.currentPage - Trang hiện tại
     * @param {number} options.totalPages - Tổng số trang
     * @param {Function} options.onPageChange - Callback khi thay đổi trang
     * @param {Object} options.config - Cấu hình tùy chỉnh
     * @returns {string} HTML string
     */
    generateHTML(options) {
        const { currentPage, totalPages, onPageChange, config = {} } = options;
        const finalConfig = { ...this.defaultConfig, ...config };
        
        if (totalPages <= 1) {
            return '';
        }

        let html = `<div class="${finalConfig.containerClass}">`;
        
        // Previous button
        if (finalConfig.showPrevNext) {
            const prevDisabled = currentPage <= 1 ? finalConfig.disabledClass : '';
            const prevPage = Math.max(1, currentPage - 1);
            html += `<button class="${finalConfig.buttonClass} ${prevDisabled}" 
                     data-page="${prevPage}" ${currentPage <= 1 ? 'disabled' : ''}>
                     ${finalConfig.prevText}
                   </button>`;
        }

        // Page numbers
        const pageNumbers = this.calculateVisiblePages(currentPage, totalPages, finalConfig.maxVisiblePages);
        
        pageNumbers.forEach(page => {
            if (page === '...') {
                html += `<span class="${finalConfig.ellipsisClass}">${finalConfig.ellipsisText}</span>`;
            } else {
                const activeClass = page === currentPage ? finalConfig.activeClass : '';
                html += `<button class="${finalConfig.buttonClass} ${activeClass}" 
                         data-page="${page}">${page}</button>`;
            }
        });

        // Next button
        if (finalConfig.showPrevNext) {
            const nextDisabled = currentPage >= totalPages ? finalConfig.disabledClass : '';
            const nextPage = Math.min(totalPages, currentPage + 1);
            html += `<button class="${finalConfig.buttonClass} ${nextDisabled}" 
                     data-page="${nextPage}" ${currentPage >= totalPages ? 'disabled' : ''}>
                     ${finalConfig.nextText}
                   </button>`;
        }

        html += '</div>';
        return html;
    }

    /**
     * Tính toán các trang hiển thị với logic ellipsis
     */
    calculateVisiblePages(currentPage, totalPages, maxVisible) {
        const pages = [];
        
        if (totalPages <= maxVisible) {
            // Hiển thị tất cả nếu ít trang
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic phức tạp với ellipsis
            const halfVisible = Math.floor(maxVisible / 2);
            let startPage = Math.max(1, currentPage - halfVisible);
            let endPage = Math.min(totalPages, currentPage + halfVisible);

            // Điều chỉnh range để đảm bảo hiển thị đủ trang
            if (endPage - startPage + 1 < maxVisible) {
                if (startPage === 1) {
                    endPage = Math.min(totalPages, startPage + maxVisible - 1);
                } else {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                }
            }

            // Thêm trang đầu và ellipsis nếu cần
            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) {
                    pages.push('...');
                }
            }

            // Thêm range trang chính
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Thêm ellipsis và trang cuối nếu cần
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('...');
                }
                pages.push(totalPages);
            }
        }

        return pages;
    }

    /**
     * Render pagination vào container và bind events
     * @param {string|HTMLElement} container - Container element hoặc selector
     * @param {Object} options - Cấu hình pagination
     */
    render(container, options) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!element) {
            console.warn('Pagination container not found:', container);
            return;
        }

        const html = this.generateHTML(options);
        element.innerHTML = html;

        // Bind click events
        if (options.onPageChange) {
            element.querySelectorAll(`[data-page]:not([disabled])`).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(btn.getAttribute('data-page'));
                    if (page && page !== options.currentPage) {
                        options.onPageChange(page);
                    }
                });
            });
        }
    }

    /**
     * Tạo thông tin pagination (hiển thị "Showing X of Y records")
     */
    generateInfo(currentPage, totalPages, totalRecords, recordsPerPage) {
        const startRecord = ((currentPage - 1) * recordsPerPage) + 1;
        const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
        
        return {
            text: `Hiển thị ${startRecord}-${endRecord} trong ${totalRecords} mục`,
            startRecord,
            endRecord,
            totalRecords
        };
    }

    /**
     * Helper function cho admin panel
     */
    renderAdminPagination(containerId, currentPage, totalPages, totalRecords, limit, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Cấu hình cho admin panel
        const config = {
            maxVisiblePages: 7,
            containerClass: 'admin-pagination',
            buttonClass: 'btn btn-outline-primary btn-sm',
            activeClass: 'active',
            disabledClass: 'disabled'
        };

        this.render(container, {
            currentPage,
            totalPages,
            onPageChange,
            config
        });

        // Thêm thông tin pagination
        const info = this.generateInfo(currentPage, totalPages, totalRecords, limit);
        const infoElement = container.querySelector('.pagination-info') || 
                           container.appendChild(document.createElement('div'));
        infoElement.className = 'pagination-info';
        infoElement.textContent = info.text;
    }

    /**
     * Helper function cho user pages
     */
    renderUserPagination(containerId, currentPage, totalPages, onPageChange) {
        const config = {
            maxVisiblePages: 5,
            containerClass: 'pagination',
            buttonClass: 'pagination-btn',
            activeClass: 'active'
        };

        this.render(containerId, {
            currentPage,
            totalPages,
            onPageChange,
            config
        });
    }
}

// Export singleton instance
window.PaginationUtils = new PaginationUtils();
