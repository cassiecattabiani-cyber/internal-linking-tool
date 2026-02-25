/**
 * Internal Linking Tool - Main Application
 * SEO Dashboard for identifying underperforming pages and interlink recommendations
 */

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
    dot.className = 'status-dot ' + status;
    const titles = {
        connected: 'Connected',
        disconnected: 'Not connected',
        pending: 'Testing connection...'
    };
    dot.title = titles[status] || 'Unknown';
    apiStatus[api] = status;
}

// ========================================
// Mock Data Generation
// ========================================
const urlPaths = [
    // Global paths (no market prefix)
    '/blog/seo-best-practices', '/products/analytics-tool', '/guides/keyword-research',
    '/blog/link-building-strategies', '/services/technical-seo', '/blog/content-optimization',
    // US market
    '/us/blog/seo-best-practices', '/us/products/analytics-tool', '/us/guides/keyword-research',
    '/us/blog/link-building-strategies', '/us/services/technical-seo', '/us/blog/content-optimization',
    // AU market
    '/au/blog/seo-best-practices', '/au/products/analytics-tool', '/au/guides/keyword-research',
    '/au/blog/link-building-strategies', '/au/services/technical-seo',
    // GB market
    '/gb/blog/seo-best-practices', '/gb/products/analytics-tool', '/gb/guides/keyword-research',
    '/gb/blog/link-building-strategies', '/gb/services/technical-seo',
    // CA market
    '/ca/blog/seo-best-practices', '/ca/products/analytics-tool', '/ca/guides/keyword-research',
    '/ca/blog/link-building-strategies', '/ca/services/technical-seo',
    // IE market
    '/ie/blog/seo-best-practices', '/ie/products/analytics-tool', '/ie/guides/keyword-research',
    // ES market
    '/es/blog/seo-best-practices', '/es/products/analytics-tool', '/es/guides/keyword-research',
    // JP market
    '/jp/blog/seo-best-practices', '/jp/products/analytics-tool', '/jp/guides/keyword-research',
    // FR market
    '/fr/blog/seo-best-practices', '/fr/products/analytics-tool', '/fr/guides/keyword-research',
    // More global paths
    '/products/rank-tracker', '/guides/local-seo', '/blog/mobile-seo-tips',
    '/services/site-audit', '/blog/voice-search-optimization', '/products/backlink-analyzer',
    '/guides/ecommerce-seo', '/blog/featured-snippets', '/services/penalty-recovery',
    '/blog/schema-markup-guide', '/products/keyword-planner', '/guides/international-seo',
    '/blog/page-speed-optimization', '/services/content-strategy', '/blog/competitor-analysis'
];

const techIssues = ['low-inlinks', 'orphaned', 'not-in-sitemap'];
const techLabels = {
    'low-inlinks': 'Low Inlinks',
    'orphaned': 'Orphaned',
    'not-in-sitemap': 'Not in Sitemap'
};

let pagesData = [];
let sortColumn = 'priority';
let sortDirection = 'desc';

function generateMockData() {
    pagesData = urlPaths.map((path, index) => {
        const bucket = Math.random() > 0.6 ? 1 : 2;
        const position = Math.floor(Math.random() * 50) + 1;
        const change = Math.floor(Math.random() * 20) - 10;
        const volume = Math.floor(Math.random() * 10000) + 100;
        const inlinks = Math.floor(Math.random() * 15);
        const issues = techIssues.filter(() => Math.random() > 0.7);
        
        // Add low-inlinks issue if inlinks < 3
        if (inlinks < 3 && !issues.includes('low-inlinks')) {
            issues.push('low-inlinks');
        }
        
        let priority = 0;
        if (bucket === 1) priority += 40;
        if (change > 3) priority += 20; // Positive change means rank dropped (bad)
        if (inlinks < 3) priority += 15;
        if (issues.length > 0) priority += issues.length * 5;
        if (volume > 1000) priority += 10;
        priority = Math.min(100, priority);

        return {
            id: index,
            url: path,
            priority,
            bucket,
            position,
            change,
            volume,
            inlinks,
            techIssues: issues,
            keywords: generateKeywords(),
            rankHistory: generateRankHistory(position),
            recommendations: generateRecommendations()
        };
    });
    updateMetrics();
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
    // Generate monthly data for multiple years
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
// Metrics Update
// ========================================
function updateMetrics() {
    const total = pagesData.length;
    // Poor performers = high priority (>= 50)
    const poorPerformers = pagesData.filter(p => p.priority >= 50).length;
    // Well performers = low priority (< 50)
    const wellPerformers = pagesData.filter(p => p.priority < 50).length;
    
    document.getElementById('totalPages').textContent = total;
    document.getElementById('poorPerformers').textContent = poorPerformers;
    document.getElementById('wellPerformers').textContent = wellPerformers;
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
        if (bucketFilter === 'poor' && page.priority < 50) return false;
        if (bucketFilter === 'moderate' && page.priority >= 50) return false;
        
        // Market filter - check if URL contains market prefix (e.g., /us/, /ca/, etc.)
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
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    tbody.innerHTML = filtered.map(page => {
        // Change logic: negative change = rank improved (lower number is better) = GREEN with down arrow
        // positive change = rank declined (higher number is worse) = RED with up arrow
        let changeClass = 'change-neutral';
        let changeIcon = '';
        let changeDisplay = '—';
        
        if (page.change < 0) {
            // Rank improved (e.g., went from position 15 to 10, change = -5)
            changeClass = 'change-down';
            changeIcon = '<i class="fas fa-arrow-down"></i>';
            changeDisplay = `${changeIcon} ${Math.abs(page.change)}`;
        } else if (page.change > 0) {
            // Rank declined (e.g., went from position 10 to 15, change = +5)
            changeClass = 'change-up';
            changeIcon = '<i class="fas fa-arrow-up"></i>';
            changeDisplay = `${changeIcon} ${Math.abs(page.change)}`;
        }
        
        const categoryLabel = page.bucket === 1 ? 'Poor' : 'Moderate/Well';
        
        return `
        <tr>
            <td class="url-cell" title="${page.url}">${page.url}</td>
            <td><span class="priority-score ${page.priority >= 70 ? 'priority-high' : page.priority >= 40 ? 'priority-medium' : 'priority-low'}">${page.priority}</span></td>
            <td><span class="bucket-badge bucket-${page.bucket}">${categoryLabel}</span></td>
            <td>${page.position}</td>
            <td class="${changeClass}">${changeDisplay}</td>
            <td>${page.volume.toLocaleString()}</td>
            <td>${page.inlinks}</td>
            <td>
                <div class="tech-badges">
                    ${page.techIssues.map(issue => `<span class="tech-badge">${techLabels[issue]}</span>`).join('')}
                </div>
            </td>
            <td><button class="btn-view" onclick="openModal(${page.id})"><i class="fas fa-eye"></i> View</button></td>
        </tr>
    `}).join('');
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
    // TODO: Apply threshold settings to filtering logic
    showToast('Settings applied! Recalculating priorities...', 'success');
    generateMockData();
}

// ========================================
// API Functions (Placeholders)
// ========================================
function testSemrushAPI() {
    const token = document.getElementById('semrushToken').value;
    if (!token) {
        showToast('Please enter a SEMRush API token', 'warning');
        return;
    }
    
    updateStatusDot('semrush', 'pending');
    showToast('Testing SEMRush connection...', 'info', 2000);
    
    // TODO: Implement actual SEMRush API connection test
    // fetch('https://api.semrush.com/...', { headers: { 'Authorization': token } })
    
    // Simulate API test
    setTimeout(() => {
        const success = Math.random() > 0.3;
        if (success) {
            updateStatusDot('semrush', 'connected');
            showToast('SEMRush API connected successfully!', 'success');
        } else {
            updateStatusDot('semrush', 'disconnected');
            showToast('SEMRush API connection failed. Check your token.', 'error');
        }
    }, 1500);
}

function testOncrawlAPI() {
    const token = document.getElementById('oncrawlToken').value;
    if (!token) {
        showToast('Please enter an OnCrawl API token', 'warning');
        return;
    }
    
    updateStatusDot('oncrawl', 'pending');
    showToast('Testing OnCrawl connection...', 'info', 2000);
    
    // TODO: Implement actual OnCrawl API connection test
    // fetch('https://app.oncrawl.com/api/...', { headers: { 'Authorization': token } })
    
    // Simulate API test
    setTimeout(() => {
        const success = Math.random() > 0.3;
        if (success) {
            updateStatusDot('oncrawl', 'connected');
            showToast('OnCrawl API connected successfully!', 'success');
        } else {
            updateStatusDot('oncrawl', 'disconnected');
            showToast('OnCrawl API connection failed. Check your token.', 'error');
        }
    }, 1500);
}

function saveConfiguration() {
    const semrushToken = document.getElementById('semrushToken').value;
    const oncrawlToken = document.getElementById('oncrawlToken').value;
    
    if (!semrushToken && !oncrawlToken) {
        showToast('Please enter at least one API token', 'warning');
        return;
    }
    
    // TODO: Save configuration to localStorage or backend
    // localStorage.setItem('apiConfig', JSON.stringify({ semrushToken, oncrawlToken }));
    
    showToast('Configuration saved successfully!', 'success');
}

function fetchSEMRushData(domain) {
    // TODO: Fetch ranking data from SEMRush API
    // Returns: { keywords: [], positions: [], volumes: [] }
    console.log('TODO: Implement SEMRush data fetch for', domain);
}

function fetchOnCrawlData(projectId) {
    // TODO: Fetch technical SEO data from OnCrawl API
    // Returns: { pages: [], issues: [], inlinks: [] }
    console.log('TODO: Implement OnCrawl data fetch for project', projectId);
}

// ========================================
// Modal Functions
// ========================================
function openModal(pageId) {
    const page = pagesData.find(p => p.id === pageId);
    if (!page) return;

    document.getElementById('modalTitle').textContent = page.url;
    document.getElementById('modalOverlay').classList.add('active');

    // Render tech checklist
    const techItems = [
        { key: 'low-inlinks', label: 'Sufficient Inlinks (≥3)' },
        { key: 'orphaned', label: 'Not Orphaned' },
        { key: 'not-in-sitemap', label: 'In Sitemap' }
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

    // Store current page for chart updates
    window.currentChartPage = page;
    
    // Draw chart with default year - use setTimeout to ensure modal is fully rendered
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
    
    // Destroy existing chart if it exists
    if (rankingChartInstance) {
        rankingChartInstance.destroy();
    }

    // Get data for selected year
    const history = historyData[year] || historyData[2024] || [];
    const months = history.map(h => h.month);
    const positions = history.map(h => h.position);
    
    // Get colors based on theme
    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

    rankingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Position',
                data: positions,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 10,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#3b82f6',
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
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: '#3b82f6',
                    titleFont: {
                        size: 14,
                        weight: '600',
                        family: 'Inter'
                    },
                    bodyFont: {
                        size: 18,
                        weight: '700',
                        family: 'Inter'
                    },
                    padding: 14,
                    cornerRadius: 10,
                    borderColor: isDark ? '#475569' : '#e2e8f0',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label + ' ' + year;
                        },
                        label: function(context) {
                            return 'Position: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    }
                },
                y: {
                    reverse: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        stepSize: 5
                    },
                    title: {
                        display: true,
                        text: 'Position',
                        color: textColor,
                        font: {
                            size: 12,
                            family: 'Inter',
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// ========================================
// Export Functions
// ========================================
function exportCSV() {
    const headers = ['URL', 'Priority', 'Bucket', 'Position', 'Change', 'Search Volume', 'Tech Issues', 'Inlinks'];
    const rows = pagesData.map(p => [
        p.url, p.priority, p.bucket, p.position, p.change, p.volume, 
        p.techIssues.map(i => techLabels[i]).join('; '), p.inlinks
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
    // TODO: Implement PDF export (would require a PDF library like jsPDF)
    showToast('PDF export requires additional library integration', 'warning');
}

// ========================================
// Initialize Application
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    generateMockData();
    showToast('Dashboard loaded with ' + pagesData.length + ' pages', 'info', 3000);
});
