/**
 * Internal Linking Tool - Main Application
 * SEO Dashboard for identifying underperforming pages and interlink recommendations
 */

// ========================================
// Configuration
// ========================================
const API_BASE_URL = 'http://127.0.0.1:8000';

// ========================================
// Toast Notification System
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
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="dismissToast(this.parentElement)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        dismissToast(toast);
    }, duration);
}

function dismissToast(toast) {
    if (toast && toast.parentElement) {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

// ========================================
// API Connection Status
// ========================================
let apiStatus = {
    semrush: 'disconnected',
    oncrawl: 'disconnected'
};

function updateStatusDot(api, status) {
    const dot = document.getElementById(`${api}Status`);
    if (dot) {
        dot.className = 'status-dot ' + status;
        const titles = {
            connected: 'Connected',
            disconnected: 'Not connected',
            pending: 'Testing connection...'
        };
        dot.title = titles[status] || 'Unknown';
    }
    apiStatus[api] = status;
}

// ========================================
// Data Storage
// ========================================
let pagesData = [];
let dashboardMetrics = {};
let sortColumn = 'priority_score';
let sortDirection = 'desc';
let isUsingRealData = false;

const techLabels = {
    'low_inlinks': 'Low Inlinks',
    'orphaned': 'Orphaned',
    'deep_page': 'Deep Page',
    'not_in_sitemap': 'Not in Sitemap'
};

// ========================================
// Loading States
// ========================================
function showTableLoading() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="9">
                <div class="table-loading">
                    <span class="spinner"></span>
                    <span class="table-loading-text">Loading page data...</span>
                </div>
            </td>
        </tr>
    `;
}

function setMetricLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        const isSmall = el.classList.contains('metric-value-small') || elementId.includes('Count');
        el.innerHTML = `<span class="${isSmall ? 'spinner-small' : 'spinner'}"></span>`;
    }
}

function setAllMetricsLoading() {
    // Main metrics
    setMetricLoading('totalPages');
    setMetricLoading('poorPerformers');
    setMetricLoading('wellPerformers');
    
    // Technical gap metrics
    setMetricLoading('lowInlinksCount');
    setMetricLoading('orphanedCount');
    setMetricLoading('deepPagesCount');
    setMetricLoading('notInSitemapCount');
}

// ========================================
// API Functions
// ========================================
async function fetchFromAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

async function testBackendConnection() {
    try {
        const health = await fetchFromAPI('/health');
        return health.status === 'healthy';
    } catch (error) {
        return false;
    }
}

async function testOncrawlAPI() {
    updateStatusDot('oncrawl', 'pending');
    showToast('Testing OnCrawl connection...', 'info', 2000);
    
    try {
        const result = await fetchFromAPI('/api/oncrawl/test');
        
        if (result.success) {
            updateStatusDot('oncrawl', 'connected');
            showToast(`OnCrawl connected! Found ${result.project_count} projects.`, 'success');
            await loadDashboardData();
        } else {
            updateStatusDot('oncrawl', 'disconnected');
            showToast('OnCrawl connection failed: ' + result.message, 'error');
        }
    } catch (error) {
        updateStatusDot('oncrawl', 'disconnected');
        showToast('Backend not available. Using mock data.', 'warning');
        generateMockData();
    }
}

function testSemrushAPI() {
    const token = document.getElementById('semrushToken').value;
    if (!token) {
        showToast('Please enter a SEMRush API token', 'warning');
        return;
    }
    
    updateStatusDot('semrush', 'pending');
    showToast('Testing SEMRush connection...', 'info', 2000);
    
    setTimeout(() => {
        showToast('SEMRush integration coming soon', 'info');
        updateStatusDot('semrush', 'disconnected');
    }, 1500);
}

async function loadDashboardData() {
    try {
        setAllMetricsLoading();
        showTableLoading();
        showToast('Loading data from OnCrawl...', 'info', 2000);
        
        // Fetch dashboard metrics
        const metrics = await fetchFromAPI('/api/dashboard/metrics');
        dashboardMetrics = metrics;
        
        // Update main metric cards
        document.getElementById('totalPages').textContent = metrics.total_pages.toLocaleString();
        
        // Critical = orphaned + pages with multiple issues (estimate)
        const criticalCount = metrics.orphaned_pages;
        document.getElementById('poorPerformers').textContent = criticalCount.toLocaleString();
        
        // Moderate = low inlinks (non-orphaned)
        const moderateCount = metrics.low_inlinks_pages || 0;
        document.getElementById('wellPerformers').textContent = moderateCount.toLocaleString();
        
        // Update technical gap cards
        document.getElementById('lowInlinksCount').textContent = (metrics.low_inlinks_pages || 0).toLocaleString();
        document.getElementById('orphanedCount').textContent = (metrics.orphaned_pages || 0).toLocaleString();
        document.getElementById('deepPagesCount').textContent = (metrics.deep_pages || 0).toLocaleString();
        document.getElementById('notInSitemapCount').textContent = (metrics.not_in_sitemap_pages || 0).toLocaleString();
        
        // Fetch priority pages
        const priorityData = await fetchFromAPI('/api/dashboard/priority-pages?limit=100');
        
        // Transform API data to match our table format
        pagesData = priorityData.pages.map((page, index) => ({
            id: index,
            url: page.url,
            priority: page.priority_score,
            priority_score: page.priority_score,
            bucket: page.technical_gaps.includes('orphaned') || page.technical_gaps.length >= 2 ? 1 : 2,
            position: null, // Awaiting SEMRush
            change: null, // Awaiting SEMRush
            volume: null, // Awaiting SEMRush
            inlinks: page.nb_inlinks || 0,
            depth: page.depth || 0,
            title: page.title || '',
            techIssues: page.technical_gaps || [],
            keywords: generateKeywords(),
            rankHistory: generateRankHistory(Math.floor(Math.random() * 30) + 1),
            recommendations: generateRecommendations()
        }));
        
        isUsingRealData = true;
        renderTable();
        showToast(`Loaded ${pagesData.length} priority pages from OnCrawl`, 'success');
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('Failed to load data. Using mock data.', 'warning');
        generateMockData();
    }
}

// ========================================
// Mock Data Generation (Fallback)
// ========================================
const urlPaths = [
    '/us/blog/seo-best-practices', '/us/products/analytics-tool', '/us/guides/keyword-research',
    '/us/blog/link-building-strategies', '/us/services/technical-seo', '/us/blog/content-optimization',
    '/au/blog/seo-best-practices', '/au/products/analytics-tool', '/au/guides/keyword-research',
    '/gb/blog/seo-best-practices', '/gb/products/analytics-tool', '/gb/guides/keyword-research',
    '/ca/blog/seo-best-practices', '/ca/products/analytics-tool', '/ca/guides/keyword-research',
    '/ie/blog/seo-best-practices', '/ie/products/analytics-tool',
    '/es/blog/seo-best-practices', '/es/products/analytics-tool',
    '/jp/blog/seo-best-practices', '/jp/products/analytics-tool',
    '/fr/blog/seo-best-practices', '/fr/products/analytics-tool',
    '/products/rank-tracker', '/guides/local-seo', '/blog/mobile-seo-tips',
    '/services/site-audit', '/blog/voice-search-optimization', '/products/backlink-analyzer'
];

function generateMockData() {
    isUsingRealData = false;
    
    // Update metrics with mock data
    document.getElementById('totalPages').textContent = '1,247';
    document.getElementById('poorPerformers').textContent = '89';
    document.getElementById('wellPerformers').textContent = '342';
    document.getElementById('lowInlinksCount').textContent = '342';
    document.getElementById('orphanedCount').textContent = '89';
    document.getElementById('deepPagesCount').textContent = '567';
    document.getElementById('notInSitemapCount').textContent = '23';
    
    pagesData = urlPaths.map((path, index) => {
        const bucket = Math.random() > 0.6 ? 1 : 2;
        const position = Math.floor(Math.random() * 50) + 1;
        const change = Math.floor(Math.random() * 20) - 10;
        const volume = Math.floor(Math.random() * 10000) + 100;
        const inlinks = Math.floor(Math.random() * 15);
        const issues = ['low_inlinks', 'orphaned', 'deep_page'].filter(() => Math.random() > 0.7);
        
        if (inlinks < 3 && !issues.includes('low_inlinks')) {
            issues.push('low_inlinks');
        }
        
        let priority = 0;
        if (bucket === 1) priority += 40;
        if (change > 3) priority += 20;
        if (inlinks < 3) priority += 15;
        if (issues.length > 0) priority += issues.length * 5;
        if (volume > 1000) priority += 10;
        priority = Math.min(100, priority);

        return {
            id: index,
            url: path,
            priority,
            priority_score: priority,
            bucket,
            position,
            change,
            volume,
            inlinks,
            depth: Math.floor(Math.random() * 5) + 1,
            title: 'Page Title ' + index,
            techIssues: issues,
            keywords: generateKeywords(),
            rankHistory: generateRankHistory(position),
            recommendations: generateRecommendations()
        };
    });
    
    renderTable();
}

function generateKeywords() {
    const keywords = ['SEO optimization', 'search rankings', 'organic traffic', 'backlinks', 
        'keyword research', 'content strategy', 'technical SEO', 'link building'];
    const count = Math.floor(Math.random() * 4) + 2;
    return keywords.slice(0, count).map(kw => ({
        keyword: kw,
        volume: Math.floor(Math.random() * 5000) + 100
    }));
}

function generateRankHistory(currentPos) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = [2024, 2023, 2022];
    const history = {};
    
    years.forEach(year => {
        history[year] = [];
        let pos = currentPos + Math.floor(Math.random() * 15) - 7;
        months.forEach((month, idx) => {
            pos += Math.floor(Math.random() * 8) - 4;
            pos = Math.max(1, Math.min(100, pos));
            history[year].push({ month: month, monthIndex: idx, position: pos });
        });
    });
    
    return history;
}

function generateRecommendations() {
    const sources = ['/blog/related-topic', '/guides/complementary-guide', '/products/similar-tool',
        '/services/related-service', '/blog/supporting-content'];
    return sources.slice(0, Math.floor(Math.random() * 4) + 1).map(src => ({
        source: src,
        relevance: Math.floor(Math.random() * 40) + 60,
        anchor: ['Learn more about', 'Discover how to', 'See our guide on', 'Check out'][Math.floor(Math.random() * 4)] + ' this topic'
    }));
}

// ========================================
// Table Rendering
// ========================================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const bucketFilter = document.getElementById('bucketFilter').value;
    const marketFilter = document.getElementById('marketFilter').value;

    let filtered = pagesData.filter(page => {
        if (searchTerm && !page.url.toLowerCase().includes(searchTerm)) return false;
        if (bucketFilter === 'poor' && page.bucket !== 1) return false;
        if (bucketFilter === 'moderate' && page.bucket !== 2) return false;
        
        if (marketFilter !== 'global') {
            const marketPrefix = '/' + marketFilter + '/';
            if (!page.url.toLowerCase().includes(marketPrefix)) return false;
        }
        
        return true;
    });

    filtered.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        if (sortColumn === 'url') {
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        // Handle null values
        if (aVal === null) aVal = sortDirection === 'asc' ? Infinity : -Infinity;
        if (bVal === null) bVal = sortDirection === 'asc' ? Infinity : -Infinity;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    tbody.innerHTML = filtered.map(page => {
        const priorityScore = page.priority_score || page.priority;
        const categoryLabel = page.bucket === 1 ? 'Critical' : 'Moderate';
        
        // SEMRush data - show awaiting badge if null
        const positionDisplay = page.position !== null 
            ? page.position 
            : '<span class="awaiting-data"><i class="fas fa-clock"></i> Awaiting SEMRush</span>';
        
        const changeDisplay = page.change !== null 
            ? formatChange(page.change)
            : '<span class="awaiting-data"><i class="fas fa-clock"></i> Awaiting SEMRush</span>';
        
        const volumeDisplay = page.volume !== null 
            ? page.volume.toLocaleString()
            : '<span class="awaiting-data"><i class="fas fa-clock"></i> Awaiting SEMRush</span>';
        
        return `
        <tr>
            <td class="url-cell" title="${page.url}">${page.url}</td>
            <td><span class="priority-score ${priorityScore >= 70 ? 'priority-high' : priorityScore >= 40 ? 'priority-medium' : 'priority-low'}">${priorityScore}</span></td>
            <td><span class="bucket-badge bucket-${page.bucket}">${categoryLabel}</span></td>
            <td>${positionDisplay}</td>
            <td>${changeDisplay}</td>
            <td>${volumeDisplay}</td>
            <td>${page.inlinks}</td>
            <td>
                <div class="tech-badges">
                    ${page.techIssues.map(issue => `<span class="tech-badge">${techLabels[issue] || issue}</span>`).join('')}
                </div>
            </td>
            <td><button class="btn-view" onclick="openModal(${page.id})"><i class="fas fa-eye"></i> View</button></td>
        </tr>
    `}).join('');
    
    // Show message if no results
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
                    No pages match your filters
                </td>
            </tr>
        `;
    }
}

function formatChange(change) {
    if (change === 0) return '<span class="change-neutral">—</span>';
    if (change < 0) {
        return `<span class="change-down"><i class="fas fa-arrow-down"></i> ${Math.abs(change)}</span>`;
    }
    return `<span class="change-up"><i class="fas fa-arrow-up"></i> ${Math.abs(change)}</span>`;
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'desc';
    }
    renderTable();
}

function filterTable() {
    renderTable();
}

// ========================================
// UI Controls
// ========================================
function togglePanel(panelId) {
    document.getElementById(panelId).classList.toggle('collapsed');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    showToast('Theme changed', 'info', 2000);
}

function updateSlider(name) {
    const slider = document.getElementById(name + 'Slider');
    const value = document.getElementById(name + 'Value');
    value.textContent = slider.value;
}

function applySettings() {
    showToast('Settings applied! Recalculating priorities...', 'success');
    if (isUsingRealData) {
        loadDashboardData();
    } else {
        generateMockData();
    }
}

function saveConfiguration() {
    const semrushToken = document.getElementById('semrushToken').value;
    const oncrawlToken = document.getElementById('oncrawlToken').value;
    
    if (!semrushToken && !oncrawlToken) {
        showToast('Please enter at least one API token', 'warning');
        return;
    }
    
    localStorage.setItem('apiConfig', JSON.stringify({ semrushToken, oncrawlToken }));
    showToast('Configuration saved!', 'success');
}

// ========================================
// Modal Functions
// ========================================
function openModal(pageId) {
    const page = pagesData.find(p => p.id === pageId);
    if (!page) return;

    document.getElementById('modalTitle').textContent = page.title || page.url;
    document.getElementById('modalOverlay').classList.add('active');

    // Render tech checklist
    const techItems = [
        { key: 'low_inlinks', label: 'Sufficient Inlinks (≥3)' },
        { key: 'orphaned', label: 'Not Orphaned' },
        { key: 'deep_page', label: 'Not Too Deep (≤3)' },
        { key: 'not_in_sitemap', label: 'In Sitemap' }
    ];
    document.getElementById('techChecklist').innerHTML = techItems.map(item => `
        <li>
            <i class="fas ${page.techIssues.includes(item.key) ? 'fa-times-circle issue' : 'fa-check-circle ok'}"></i>
            ${item.label}
        </li>
    `).join('');

    // Render recommendations
    document.getElementById('recTableBody').innerHTML = page.recommendations.map(rec => `
        <tr>
            <td class="url-cell">${rec.source}</td>
            <td>
                <div class="relevance-bar"><div class="relevance-fill" style="width: ${rec.relevance}%"></div></div>
                <span style="font-size: 11px; margin-left: 8px;">${rec.relevance}%</span>
            </td>
            <td class="anchor-text">"${rec.anchor}"</td>
            <td><button class="btn btn-secondary btn-view" onclick="addLink('${rec.source}')">Add Link</button></td>
        </tr>
    `).join('');

    window.currentChartPage = page;
    
    setTimeout(() => {
        const selectedYear = document.getElementById('yearSelector').value;
        drawRankingChart(page.rankHistory, selectedYear);
    }, 100);
}

function addLink(source) {
    showToast(`Link from "${source}" added to queue`, 'success');
}

function closeModal(event) {
    if (!event || event.target === document.getElementById('modalOverlay')) {
        document.getElementById('modalOverlay').classList.remove('active');
    }
}

function updateChartYear() {
    if (window.currentChartPage) {
        const selectedYear = document.getElementById('yearSelector').value;
        drawRankingChart(window.currentChartPage.rankHistory, selectedYear);
    }
}

// ========================================
// Chart.js Implementation
// ========================================
let rankingChartInstance = null;

function drawRankingChart(historyData, year) {
    const canvas = document.getElementById('rankingChart');
    const ctx = canvas.getContext('2d');
    
    if (rankingChartInstance) {
        rankingChartInstance.destroy();
    }

    const history = historyData[year] || historyData[2024] || [];
    const months = history.map(h => h.month);
    const positions = history.map(h => h.position);
    
    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(26, 26, 26, 0.4)');
    gradient.addColorStop(1, 'rgba(26, 26, 26, 0.02)');

    rankingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Position',
                data: positions,
                borderColor: '#1a1a1a',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 10,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#1a1a1a',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#1a1a1a',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: '#1a1a1a',
                    titleFont: { size: 14, weight: '600', family: 'Inter' },
                    bodyFont: { size: 18, weight: '700', family: 'Inter' },
                    padding: 14,
                    cornerRadius: 10,
                    borderColor: isDark ? '#475569' : '#e2e8f0',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: (context) => context[0].label + ' ' + year,
                        label: (context) => 'Position: ' + context.parsed.y
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: textColor, font: { size: 11, family: 'Inter' } }
                },
                y: {
                    reverse: true,
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: textColor, font: { size: 11, family: 'Inter' }, stepSize: 5 },
                    title: {
                        display: true,
                        text: 'Position',
                        color: textColor,
                        font: { size: 12, family: 'Inter', weight: '500' }
                    }
                }
            },
            animation: { duration: 750, easing: 'easeInOutQuart' }
        }
    });
}

// ========================================
// Export Functions
// ========================================
function exportCSV() {
    const headers = ['URL', 'Priority Score', 'Category', 'Position', 'Change', 'Search Volume', 'Inlinks', 'Tech Issues'];
    const rows = pagesData.map(p => [
        p.url, 
        p.priority_score || p.priority, 
        p.bucket === 1 ? 'Critical' : 'Moderate',
        p.position !== null ? p.position : 'Awaiting SEMRush',
        p.change !== null ? p.change : 'Awaiting SEMRush',
        p.volume !== null ? p.volume : 'Awaiting SEMRush',
        p.inlinks,
        p.techIssues.map(i => techLabels[i] || i).join('; ')
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
    
    showToast('CSV exported successfully!', 'success');
}

function exportPDF() {
    showToast('PDF export requires additional library integration', 'warning');
}

// ========================================
// Initialize Application
// ========================================
document.addEventListener('DOMContentLoaded', async function() {
    // Load saved config
    const savedConfig = localStorage.getItem('apiConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.semrushToken) document.getElementById('semrushToken').value = config.semrushToken;
        if (config.oncrawlToken) document.getElementById('oncrawlToken').value = config.oncrawlToken;
    }
    
    // Show loading states
    setAllMetricsLoading();
    showTableLoading();
    
    // Try to connect to backend
    const backendAvailable = await testBackendConnection();
    
    if (backendAvailable) {
        showToast('Backend connected! Loading real data...', 'success');
        updateStatusDot('oncrawl', 'connected');
        await loadDashboardData();
    } else {
        showToast('Backend not available. Using mock data.', 'warning');
        generateMockData();
    }
});
