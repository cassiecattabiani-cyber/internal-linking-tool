/**
 * Internal Linking Tool v2 - Split-View Dashboard
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

// Data Storage
let pagesData = [];
let filteredData = [];
let selectedPage = null;
let currentPage = 1;
const rowsPerPage = 100;
let sortColumn = 'priority_score';
let sortDirection = 'desc';

const techLabels = {
    'low_inlinks': 'Low Inlinks',
    'orphaned': 'Orphaned',
    'deep_page': 'Deep Page',
    'not_in_sitemap': 'Not in Sitemap'
};

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// ========================================
// Tab Navigation
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            
            // Update nav
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
    
    // Initialize
    initializeApp();
});

async function initializeApp() {
    showToast('Loading data...', 'info', 2000);
    
    const backendAvailable = await testBackendConnection();
    
    if (backendAvailable) {
        showToast('Connected to backend!', 'success');
        await loadDashboardData();
    } else {
        showToast('Backend not available. Using mock data.', 'warning');
        generateMockData();
    }
}

// ========================================
// API Functions
// ========================================
async function fetchFromAPI(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

async function testBackendConnection() {
    try {
        const health = await fetchFromAPI('/health');
        return health.status === 'healthy';
    } catch {
        return false;
    }
}

async function loadDashboardData() {
    try {
        // Load metrics
        const metrics = await fetchFromAPI('/api/dashboard/metrics');
        updateSidebarStats(metrics);
        updateGapsCards(metrics);
        
        // Load pages
        const priorityData = await fetchFromAPI('/api/dashboard/priority-pages?limit=1000');
        
        pagesData = priorityData.pages.map((page, index) => ({
            id: index,
            url: page.url,
            title: page.title || page.url,
            priority_score: page.priority_score,
            bucket: page.technical_gaps.includes('orphaned') || page.technical_gaps.length >= 2 ? 1 : 2,
            position: null,
            inlinks: page.nb_inlinks || 0,
            depth: page.depth || 0,
            techIssues: page.technical_gaps || [],
            recommendations: []
        }));
        
        applyFilters();
        renderPageCards();
        renderTable();
        renderGapsTable();
        
        showToast(`Loaded ${pagesData.length} pages`, 'success');
    } catch (error) {
        console.error('Failed to load data:', error);
        showToast('Failed to load data', 'error');
        generateMockData();
    }
}

function generateMockData() {
    const urls = [
        '/us/blog/payment-processing', '/us/guides/pos-systems', '/au/products/invoices',
        '/gb/blog/small-business-tips', '/us/services/payroll', '/ca/guides/ecommerce',
        '/us/blog/inventory-management', '/au/services/appointments', '/gb/products/hardware',
        '/us/guides/restaurant-pos', '/ca/blog/retail-tips', '/us/products/online-store',
        '/au/blog/marketing-tips', '/gb/services/banking', '/us/guides/team-management'
    ];
    
    pagesData = urls.map((url, index) => {
        const issues = [];
        if (Math.random() > 0.5) issues.push('low_inlinks');
        if (Math.random() > 0.7) issues.push('orphaned');
        if (Math.random() > 0.6) issues.push('deep_page');
        if (Math.random() > 0.8) issues.push('not_in_sitemap');
        if (issues.length === 0) issues.push('low_inlinks');
        
        return {
            id: index,
            url: url,
            title: url.split('/').pop().replace(/-/g, ' '),
            priority_score: Math.floor(Math.random() * 50) + 50,
            bucket: issues.includes('orphaned') ? 1 : 2,
            position: null,
            inlinks: Math.floor(Math.random() * 5),
            depth: Math.floor(Math.random() * 6) + 1,
            techIssues: issues,
            recommendations: []
        };
    });
    
    // Update sidebar
    document.getElementById('sidebarTotal').textContent = '1,247';
    document.getElementById('sidebarCritical').textContent = '89';
    document.getElementById('sidebarModerate').textContent = '342';
    
    // Update gaps
    document.getElementById('gapLowInlinks').textContent = '342';
    document.getElementById('gapOrphaned').textContent = '89';
    document.getElementById('gapDeepPages').textContent = '567';
    document.getElementById('gapNotInSitemap').textContent = '23';
    
    applyFilters();
    renderPageCards();
    renderTable();
    renderGapsTable();
}

function updateSidebarStats(metrics) {
    document.getElementById('sidebarTotal').textContent = (metrics.total_pages || 0).toLocaleString();
    document.getElementById('sidebarCritical').textContent = (metrics.orphaned_pages || 0).toLocaleString();
    document.getElementById('sidebarModerate').textContent = (metrics.low_inlinks_pages || 0).toLocaleString();
}

function updateGapsCards(metrics) {
    document.getElementById('gapLowInlinks').textContent = (metrics.low_inlinks_pages || 0).toLocaleString();
    document.getElementById('gapOrphaned').textContent = (metrics.orphaned_pages || 0).toLocaleString();
    document.getElementById('gapDeepPages').textContent = (metrics.deep_pages || 0).toLocaleString();
    document.getElementById('gapNotInSitemap').textContent = (metrics.not_in_sitemap_pages || 0).toLocaleString();
}

// ========================================
// Filtering
// ========================================
function applyFilters() {
    const search = document.getElementById('globalSearch').value.toLowerCase();
    const market = document.getElementById('marketFilter').value;
    const techIssue = document.getElementById('techIssueFilter').value;
    
    filteredData = pagesData.filter(page => {
        if (search && !page.url.toLowerCase().includes(search)) return false;
        if (market !== 'global' && !page.url.includes(`/${market}/`)) return false;
        if (techIssue !== 'all' && !page.techIssues.includes(techIssue)) return false;
        return true;
    });
    
    // Sort
    filteredData.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        if (sortColumn === 'url') {
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (aVal === null) aVal = sortDirection === 'asc' ? Infinity : -Infinity;
        if (bVal === null) bVal = sortDirection === 'asc' ? Infinity : -Infinity;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    currentPage = 1;
}

function handleSearch() {
    applyFilters();
    renderPageCards();
    renderTable();
}

// ========================================
// Page Cards (Dashboard)
// ========================================
function renderPageCards() {
    const container = document.getElementById('pageCardsContainer');
    const topPages = filteredData.slice(0, 8);
    
    if (topPages.length === 0) {
        container.innerHTML = `
            <div class="loading-cards">
                <i class="fas fa-search"></i>
                <span>No pages match your filters</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = topPages.map(page => {
        const scoreClass = page.priority_score >= 80 ? 'critical' : page.priority_score >= 60 ? 'high' : 'moderate';
        const categoryClass = page.bucket === 1 ? 'critical' : 'moderate';
        const categoryLabel = page.bucket === 1 ? 'Critical' : 'Moderate';
        const isSelected = selectedPage && selectedPage.id === page.id;
        
        return `
            <div class="page-card ${isSelected ? 'selected' : ''}" onclick="selectPage(${page.id})">
                <div class="page-card-header">
                    <span class="page-card-score ${scoreClass}">${page.priority_score}</span>
                    <span class="page-card-category ${categoryClass}">${categoryLabel}</span>
                </div>
                <div class="page-card-url" title="${page.url}">${page.url}</div>
                <div class="page-card-issues">
                    ${page.techIssues.map(issue => `
                        <span class="issue-tag ${issue}">${techLabels[issue]}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function selectPage(pageId) {
    selectedPage = pagesData.find(p => p.id === pageId);
    renderPageCards();
    renderDetailsPanel();
}

function renderDetailsPanel() {
    const placeholder = document.getElementById('detailsPlaceholder');
    const content = document.getElementById('detailsContent');
    
    if (!selectedPage) {
        placeholder.style.display = 'flex';
        content.style.display = 'none';
        return;
    }
    
    placeholder.style.display = 'none';
    content.style.display = 'block';
    
    // Update header
    document.getElementById('detailsTitle').textContent = selectedPage.title;
    document.getElementById('detailsUrl').textContent = selectedPage.url;
    
    // Update metrics
    document.getElementById('detailsPosition').innerHTML = selectedPage.position !== null 
        ? selectedPage.position 
        : '<span class="awaiting-badge"><i class="fas fa-clock"></i> Awaiting</span>';
    document.getElementById('detailsInlinks').textContent = selectedPage.inlinks;
    document.getElementById('detailsDepth').textContent = selectedPage.depth;
    document.getElementById('detailsScore').textContent = selectedPage.priority_score;
    
    // Update tech checklist
    const techItems = [
        { key: 'low_inlinks', label: 'Sufficient Inlinks (≥3)' },
        { key: 'orphaned', label: 'Not Orphaned' },
        { key: 'deep_page', label: 'Not Too Deep (≤3)' },
        { key: 'not_in_sitemap', label: 'In Sitemap' }
    ];
    
    document.getElementById('techChecklist').innerHTML = techItems.map(item => `
        <li>
            <i class="fas ${selectedPage.techIssues.includes(item.key) ? 'fa-times-circle' : 'fa-check-circle'}"></i>
            ${item.label}
        </li>
    `).join('');
    
    // Update recommendations (awaiting SEMRush)
    document.getElementById('recommendationsBody').innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 32px;">
                <span class="awaiting-badge">
                    <i class="fas fa-clock"></i> Awaiting SEMRush - Recommendations require keyword data
                </span>
            </td>
        </tr>
    `;
}

// ========================================
// Priority Queue Table
// ========================================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    
    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredData.length);
    const pageData = filteredData.slice(start, end);
    
    tbody.innerHTML = pageData.map(page => {
        const scoreClass = page.priority_score >= 70 ? 'high' : page.priority_score >= 40 ? 'medium' : 'low';
        const categoryClass = page.bucket === 1 ? 'critical' : 'moderate';
        const categoryLabel = page.bucket === 1 ? 'Critical' : 'Moderate';
        
        return `
            <tr>
                <td class="url-cell" title="${page.url}">${page.url}</td>
                <td><span class="score-badge ${scoreClass}">${page.priority_score}</span></td>
                <td><span class="category-badge ${categoryClass}">${categoryLabel}</span></td>
                <td>${page.position !== null ? page.position : '<span class="awaiting-badge"><i class="fas fa-clock"></i></span>'}</td>
                <td>${page.inlinks}</td>
                <td>
                    <div class="tech-badges">
                        ${page.techIssues.map(issue => `<span class="issue-tag ${issue}">${techLabels[issue]}</span>`).join('')}
                    </div>
                </td>
                <td><button class="btn-view" onclick="viewPage(${page.id})">View</button></td>
            </tr>
        `;
    }).join('');
    
    // Update results count
    document.getElementById('resultsCount').textContent = `${filteredData.length} results`;
    
    // Update pagination
    renderPagination(filteredData.length, totalPages);
}

function renderPagination(total, totalPages) {
    const info = document.getElementById('paginationInfo');
    const pages = document.getElementById('paginationPages');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (total === 0) {
        info.textContent = 'No results';
    } else {
        const start = (currentPage - 1) * rowsPerPage + 1;
        const end = Math.min(currentPage * rowsPerPage, total);
        info.textContent = `Showing ${start}-${end} of ${total}`;
    }
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    let pagesHTML = '';
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        pagesHTML += `<button class="pagination-page ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    pages.innerHTML = pagesHTML;
}

function changePage(delta) {
    currentPage += delta;
    renderTable();
}

function goToPage(page) {
    currentPage = page;
    renderTable();
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'desc';
    }
    applyFilters();
    renderTable();
}

function viewPage(pageId) {
    const page = pagesData.find(p => p.id === pageId);
    if (!page) return;
    
    openModal(page);
}

// ========================================
// Modal Functions
// ========================================
function openModal(page) {
    const modal = document.getElementById('pageModal');
    
    // Update modal content
    document.getElementById('modalTitle').textContent = page.title || 'Page Details';
    document.getElementById('modalUrl').textContent = page.url;
    
    // Update metrics
    document.getElementById('modalPosition').innerHTML = page.position !== null 
        ? page.position 
        : '<span class="awaiting-badge"><i class="fas fa-clock"></i> Awaiting</span>';
    document.getElementById('modalInlinks').textContent = page.inlinks;
    document.getElementById('modalDepth').textContent = page.depth;
    document.getElementById('modalScore').textContent = page.priority_score;
    
    // Update tech checklist
    const techItems = [
        { key: 'low_inlinks', label: 'Sufficient Inlinks (≥3)' },
        { key: 'orphaned', label: 'Not Orphaned' },
        { key: 'deep_page', label: 'Not Too Deep (≤3)' },
        { key: 'not_in_sitemap', label: 'In Sitemap' }
    ];
    
    document.getElementById('modalTechChecklist').innerHTML = techItems.map(item => `
        <li>
            <i class="fas ${page.techIssues.includes(item.key) ? 'fa-times-circle' : 'fa-check-circle'}"></i>
            ${item.label}
        </li>
    `).join('');
    
    // Update recommendations (awaiting SEMRush)
    document.getElementById('modalRecommendationsBody').innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 32px;">
                <span class="awaiting-badge">
                    <i class="fas fa-clock"></i> Awaiting SEMRush - Recommendations require keyword data
                </span>
            </td>
        </tr>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(event) {
    // If called from overlay click, only close if clicking the overlay itself
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('pageModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ========================================
// Technical Gaps Table
// ========================================
function renderGapsTable() {
    // This could be expanded to show a filtered table by gap type
}

// ========================================
// Settings
// ========================================
function updateSlider(name) {
    const slider = document.getElementById(`${name}Slider`);
    const value = document.getElementById(`${name}Value`);
    value.textContent = slider.value;
}

function saveSettings() {
    showToast('Settings saved!', 'success');
}

function testConnections() {
    showToast('Testing connections...', 'info');
    
    const oncrawlStatus = document.getElementById('oncrawlStatus');
    const semrushStatus = document.getElementById('semrushStatus');
    
    // Set pending state
    oncrawlStatus.className = 'status-indicator pending';
    oncrawlStatus.innerHTML = '<i class="fas fa-circle"></i><span>Testing...</span>';
    
    semrushStatus.className = 'status-indicator pending';
    semrushStatus.innerHTML = '<i class="fas fa-circle"></i><span>Testing...</span>';
    
    // Test OnCrawl (via backend)
    testBackendConnection().then(connected => {
        if (connected) {
            oncrawlStatus.className = 'status-indicator connected';
            oncrawlStatus.innerHTML = '<i class="fas fa-circle"></i><span>Connected</span>';
            showToast('OnCrawl connected!', 'success');
        } else {
            oncrawlStatus.className = 'status-indicator error';
            oncrawlStatus.innerHTML = '<i class="fas fa-circle"></i><span>Disconnected</span>';
            showToast('OnCrawl connection failed', 'error');
        }
    });
    
    // SEMRush - not yet integrated
    setTimeout(() => {
        semrushStatus.className = 'status-indicator pending';
        semrushStatus.innerHTML = '<i class="fas fa-circle"></i><span>Coming Soon</span>';
    }, 1000);
}

// ========================================
// Export
// ========================================
function exportCSV() {
    const headers = ['URL', 'Score', 'Category', 'Inlinks', 'Depth', 'Tech Issues'];
    const rows = filteredData.map(p => [
        p.url,
        p.priority_score,
        p.bucket === 1 ? 'Critical' : 'Moderate',
        p.inlinks,
        p.depth,
        p.techIssues.map(i => techLabels[i]).join('; ')
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'internal-linking-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('CSV exported!', 'success');
}

// ========================================
// Dark Mode
// ========================================
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    showToast('Theme changed', 'info', 2000);
}
