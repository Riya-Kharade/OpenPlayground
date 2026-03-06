// Crypto Portfolio Simulator - Complete JavaScript
// Modern ES6+ implementation with async/await, classes, and modular design

class CryptoPortfolioSimulator {
    constructor() {
        this.portfolio = [];
        this.coinCache = new Map();
        this.priceCache = new Map();
        this.chartInstances = new Map();
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.lastUpdate = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.applyTheme();
        await this.loadPortfolio();
        await this.updatePrices();
        this.renderPortfolio();
        this.renderCharts();
        this.updateRiskAnalysis();
        this.startAutoUpdate();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('export-data').addEventListener('click', () => this.exportData());

        // Add holding
        document.getElementById('add-holding-btn').addEventListener('click', () => this.openAddHoldingModal());

        // Search and filter
        document.getElementById('search-input').addEventListener('input', (e) => this.filterHoldings(e.target.value));
        document.getElementById('sort-select').addEventListener('change', (e) => this.sortHoldings(e.target.value));

        // Modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Add holding form
        document.getElementById('add-holding-form').addEventListener('submit', (e) => this.handleAddHolding(e));

        // Coin search
        document.getElementById('coin-search').addEventListener('input', (e) => this.searchCoins(e.target.value));
        document.getElementById('coin-search').addEventListener('focus', () => this.showCoinSuggestions());
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group')) {
                this.hideCoinSuggestions();
            }
        });

        // Chart controls
        document.getElementById('portfolio-chart-period').addEventListener('change', (e) => this.updatePortfolioChart(e.target.value));
        document.getElementById('allocation-chart-type').addEventListener('change', (e) => this.updateAllocationChart(e.target.value));

        // Refresh prices
        document.getElementById('refresh-prices').addEventListener('click', () => this.manualRefresh());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // Theme Management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
        this.showToast('Theme updated successfully', 'success');
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Portfolio Management
    async loadPortfolio() {
        const saved = localStorage.getItem('crypto-portfolio');
        if (saved) {
            this.portfolio = JSON.parse(saved);
        }
    }

    async savePortfolio() {
        localStorage.setItem('crypto-portfolio', JSON.stringify(this.portfolio));
    }

    async addHolding(holding) {
        try {
            this.showLoading('Adding holding...');

            // Validate coin exists
            const coinData = await this.getCoinData(holding.coinId);
            if (!coinData) {
                throw new Error('Invalid cryptocurrency selected');
            }

            // Add to portfolio
            const newHolding = {
                id: Date.now().toString(),
                coinId: holding.coinId,
                coinName: coinData.name,
                coinSymbol: coinData.symbol,
                amount: parseFloat(holding.amount),
                purchasePrice: parseFloat(holding.purchasePrice),
                purchaseDate: holding.purchaseDate || new Date().toISOString().split('T')[0],
                notes: holding.notes || ''
            };

            this.portfolio.push(newHolding);
            await this.savePortfolio();
            await this.updatePrices();
            this.renderPortfolio();
            this.renderCharts();
            this.updateRiskAnalysis();

            this.closeModal();
            this.showToast(`${coinData.name} added to portfolio`, 'success');

        } catch (error) {
            console.error('Error adding holding:', error);
            this.showToast(error.message || 'Failed to add holding', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async editHolding(id, updates) {
        try {
            const index = this.portfolio.findIndex(h => h.id === id);
            if (index === -1) return;

            this.portfolio[index] = { ...this.portfolio[index], ...updates };
            await this.savePortfolio();
            await this.updatePrices();
            this.renderPortfolio();
            this.renderCharts();
            this.updateRiskAnalysis();

            this.closeModal();
            this.showToast('Holding updated successfully', 'success');

        } catch (error) {
            console.error('Error editing holding:', error);
            this.showToast('Failed to update holding', 'error');
        }
    }

    async deleteHolding(id) {
        if (!confirm('Are you sure you want to delete this holding?')) return;

        try {
            this.portfolio = this.portfolio.filter(h => h.id !== id);
            await this.savePortfolio();
            await this.updatePrices();
            this.renderPortfolio();
            this.renderCharts();
            this.updateRiskAnalysis();

            this.showToast('Holding deleted successfully', 'success');

        } catch (error) {
            console.error('Error deleting holding:', error);
            this.showToast('Failed to delete holding', 'error');
        }
    }

    // Price Updates
    async updatePrices() {
        if (this.portfolio.length === 0) return;

        try {
            const coinIds = [...new Set(this.portfolio.map(h => h.coinId))];
            const prices = await this.fetchPrices(coinIds);

            this.portfolio.forEach(holding => {
                const priceData = prices[holding.coinId];
                if (priceData) {
                    holding.currentPrice = priceData.usd;
                    holding.priceChange24h = priceData.usd_24h_change;
                    holding.marketCap = priceData.usd_market_cap;
                    holding.volume24h = priceData.usd_24h_vol;
                }
            });

            this.lastUpdate = new Date();
            this.updateLastUpdateDisplay();
            await this.savePortfolio();

        } catch (error) {
            console.error('Error updating prices:', error);
            this.showToast('Failed to update prices', 'error');
        }
    }

    async fetchPrices(coinIds) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`);
        if (!response.ok) throw new Error('Failed to fetch prices');
        return response.json();
    }

    // Coin Search
    async searchCoins(query) {
        if (!query || query.length < 2) {
            this.hideCoinSuggestions();
            return;
        }

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            this.renderCoinSuggestions(data.coins.slice(0, 10));

        } catch (error) {
            console.error('Error searching coins:', error);
        }
    }

    renderCoinSuggestions(coins) {
        const container = document.getElementById('coin-suggestions');
        container.innerHTML = '';

        coins.forEach(coin => {
            const suggestion = document.createElement('div');
            suggestion.className = 'coin-suggestion';
            suggestion.innerHTML = `
                <img src="${coin.thumb}" alt="${coin.name}" width="24" height="24">
                <div>
                    <div style="font-weight: 600;">${coin.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${coin.symbol}</div>
                </div>
            `;
            suggestion.addEventListener('click', () => this.selectCoin(coin));
            container.appendChild(suggestion);
        });

        container.style.display = 'block';
    }

    selectCoin(coin) {
        document.getElementById('coin-search').value = coin.name;
        document.getElementById('selected-coin-id').value = coin.id;

        const display = document.getElementById('selected-coin-display');
        display.innerHTML = `
            <div class="selected-coin-info">
                <img src="${coin.large}" alt="${coin.name}" width="32" height="32">
                <div>
                    <div style="font-weight: 600;">${coin.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${coin.symbol}</div>
                </div>
            </div>
        `;

        this.hideCoinSuggestions();
    }

    hideCoinSuggestions() {
        document.getElementById('coin-suggestions').style.display = 'none';
    }

    showCoinSuggestions() {
        const container = document.getElementById('coin-suggestions');
        if (container.children.length > 0) {
            container.style.display = 'block';
        }
    }

    async getCoinData(coinId) {
        if (this.coinCache.has(coinId)) {
            return this.coinCache.get(coinId);
        }

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
            if (!response.ok) return null;

            const data = await response.json();
            this.coinCache.set(coinId, data);
            return data;

        } catch (error) {
            console.error('Error fetching coin data:', error);
            return null;
        }
    }

    // Portfolio Rendering
    renderPortfolio() {
        const tbody = document.querySelector('#holdings-table tbody');
        tbody.innerHTML = '';

        if (this.portfolio.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-chart-line"></i>
                            <h3>No holdings yet</h3>
                            <p>Add your first cryptocurrency holding to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.portfolio.forEach(holding => {
            const currentValue = holding.amount * (holding.currentPrice || 0);
            const purchaseValue = holding.amount * holding.purchasePrice;
            const pnl = currentValue - purchaseValue;
            const pnlPercent = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="coin-info">
                        <img src="https://assets.coingecko.com/coins/images/${this.getCoinImageId(holding.coinId)}/thumb/${holding.coinId}.png"
                             alt="${holding.coinName}" class="coin-logo" onerror="this.style.display='none'">
                        <div>
                            <div class="coin-name">${holding.coinName}</div>
                            <div class="coin-symbol">${holding.coinSymbol}</div>
                        </div>
                    </div>
                </td>
                <td class="holding-amount">${holding.amount.toLocaleString()}</td>
                <td class="price-value">$${holding.purchasePrice.toLocaleString()}</td>
                <td class="price-value">$${holding.currentPrice ? holding.currentPrice.toLocaleString() : 'N/A'}</td>
                <td class="price-change ${holding.priceChange24h >= 0 ? 'positive' : 'negative'}">
                    ${holding.priceChange24h ? `${holding.priceChange24h.toFixed(2)}%` : 'N/A'}
                </td>
                <td class="pnl-value ${pnl >= 0 ? 'positive' : 'negative'}">
                    ${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()} (${pnlPercent.toFixed(2)}%)
                </td>
                <td class="price-value">$${currentValue.toLocaleString()}</td>
                <td class="actions-cell">
                    <button class="action-btn edit" onclick="app.editHoldingModal('${holding.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="app.deleteHolding('${holding.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updatePortfolioOverview();
    }

    getCoinImageId(coinId) {
        // This is a simplified mapping - in a real app you'd cache this
        return Math.floor(Math.random() * 10000) + 1;
    }

    updatePortfolioOverview() {
        const totalValue = this.portfolio.reduce((sum, h) => sum + (h.amount * (h.currentPrice || 0)), 0);
        const totalPurchaseValue = this.portfolio.reduce((sum, h) => sum + (h.amount * h.purchasePrice), 0);
        const totalPnL = totalValue - totalPurchaseValue;
        const totalPnLPercent = totalPurchaseValue > 0 ? (totalPnL / totalPurchaseValue) * 100 : 0;

        document.getElementById('total-value').textContent = `$${totalValue.toLocaleString()}`;
        document.getElementById('total-pnl').textContent = `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString()} (${totalPnLPercent.toFixed(2)}%)`;
        document.getElementById('total-pnl').className = `card-change ${totalPnL >= 0 ? 'positive' : 'negative'}`;

        const holdingsCount = this.portfolio.length;
        document.getElementById('holdings-count').textContent = holdingsCount;

        // Calculate 24h change
        const totalValue24hAgo = this.portfolio.reduce((sum, h) => {
            const price24hAgo = h.currentPrice ? h.currentPrice / (1 + (h.priceChange24h || 0) / 100) : 0;
            return sum + (h.amount * price24hAgo);
        }, 0);

        const change24h = totalValue - totalValue24hAgo;
        const change24hPercent = totalValue24hAgo > 0 ? (change24h / totalValue24hAgo) * 100 : 0;

        document.getElementById('change-24h').textContent = `${change24h >= 0 ? '+' : ''}$${change24h.toLocaleString()} (${change24hPercent.toFixed(2)}%)`;
        document.getElementById('change-24h').className = `card-change ${change24h >= 0 ? 'positive' : 'negative'}`;
    }

    // Charts
    renderCharts() {
        this.renderPortfolioChart();
        this.renderAllocationChart();
    }

    async renderPortfolioChart(period = '7d') {
        const canvas = document.getElementById('portfolio-chart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.chartInstances.has('portfolio')) {
            this.chartInstances.get('portfolio').destroy();
        }

        // Generate mock historical data (in a real app, fetch from API)
        const data = this.generatePortfolioHistory(period);

        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: data.values,
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        this.chartInstances.set('portfolio', chart);
    }

    async renderAllocationChart(type = 'pie') {
        const canvas = document.getElementById('allocation-chart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.chartInstances.has('allocation')) {
            this.chartInstances.get('allocation').destroy();
        }

        const data = this.getAllocationData();

        const chart = new Chart(canvas, {
            type: type,
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#f7931a', '#627eea', '#10b981', '#ef4444',
                        '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        this.chartInstances.set('allocation', chart);
    }

    generatePortfolioHistory(period) {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const labels = [];
        const values = [];
        const baseValue = this.portfolio.reduce((sum, h) => sum + (h.amount * (h.currentPrice || 0)), 0);

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());

            // Generate realistic price movement
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            const value = baseValue * (1 + variation);
            values.push(Math.max(0, value));
        }

        return { labels, values };
    }

    getAllocationData() {
        const allocations = new Map();

        this.portfolio.forEach(holding => {
            const value = holding.amount * (holding.currentPrice || 0);
            allocations.set(holding.coinName, (allocations.get(holding.coinName) || 0) + value);
        });

        const sorted = Array.from(allocations.entries()).sort((a, b) => b[1] - a[1]);
        return {
            labels: sorted.map(([name]) => name),
            values: sorted.map(([, value]) => value)
        };
    }

    updatePortfolioChart(period) {
        this.renderPortfolioChart(period);
    }

    updateAllocationChart(type) {
        this.renderAllocationChart(type);
    }

    // Risk Analysis
    updateRiskAnalysis() {
        this.updateRiskMetrics();
        this.updateRiskRecommendations();
    }

    updateRiskMetrics() {
        const totalValue = this.portfolio.reduce((sum, h) => sum + (h.amount * (h.currentPrice || 0)), 0);

        // Calculate volatility (simplified)
        const volatilities = this.portfolio.map(h => Math.abs(h.priceChange24h || 0));
        const avgVolatility = volatilities.length > 0 ? volatilities.reduce((a, b) => a + b) / volatilities.length : 0;

        // Calculate diversification
        const allocations = this.portfolio.map(h => (h.amount * (h.currentPrice || 0)) / totalValue * 100);
        const herfindahlIndex = allocations.reduce((sum, alloc) => sum + Math.pow(alloc / 100, 2), 0);
        const diversification = Math.max(0, 100 - (herfindahlIndex * 100));

        // Calculate Sharpe ratio (simplified)
        const avgReturn = this.portfolio.reduce((sum, h) => sum + (h.priceChange24h || 0), 0) / this.portfolio.length;
        const sharpeRatio = avgVolatility > 0 ? avgReturn / avgVolatility : 0;

        // Update UI
        this.updateRiskMetric('volatility', avgVolatility);
        this.updateRiskMetric('diversification', diversification);
        this.updateRiskMetric('sharpe-ratio', sharpeRatio);
        this.updateRiskMetric('concentration', herfindahlIndex * 100);
    }

    updateRiskMetric(metricId, value) {
        const container = document.getElementById(metricId);
        if (!container) return;

        const fill = container.querySelector('.metric-fill');
        const label = container.querySelector('.metric-label');

        let percentage = 0;
        let text = '';

        switch (metricId) {
            case 'volatility':
                percentage = Math.min(100, value * 2); // Scale for display
                text = `${value.toFixed(2)}%`;
                break;
            case 'diversification':
                percentage = value;
                text = `${value.toFixed(1)}%`;
                break;
            case 'sharpe-ratio':
                percentage = Math.min(100, Math.max(0, (value + 2) * 25)); // Scale for display
                text = value.toFixed(2);
                break;
            case 'concentration':
                percentage = value;
                text = `${value.toFixed(1)}%`;
                break;
        }

        fill.style.width = `${percentage}%`;
        label.textContent = text;
    }

    updateRiskRecommendations() {
        const recommendations = [];

        const totalValue = this.portfolio.reduce((sum, h) => sum + (h.amount * (h.currentPrice || 0)), 0);
        const allocations = this.portfolio.map(h => ({
            name: h.coinName,
            percentage: (h.amount * (h.currentPrice || 0)) / totalValue * 100
        }));

        // Check diversification
        const highConcentration = allocations.filter(a => a.percentage > 50);
        if (highConcentration.length > 0) {
            recommendations.push(`⚠️ High concentration in ${highConcentration[0].name} (${highConcentration[0].percentage.toFixed(1)}%). Consider diversifying.`);
        }

        // Check volatility
        const highVolatility = this.portfolio.filter(h => Math.abs(h.priceChange24h || 0) > 10);
        if (highVolatility.length > 0) {
            recommendations.push(`📈 High volatility detected in ${highVolatility.length} holding(s). Monitor closely.`);
        }

        // Check for losses
        const losingHoldings = this.portfolio.filter(h => {
            const currentValue = h.amount * (h.currentPrice || 0);
            const purchaseValue = h.amount * h.purchasePrice;
            return currentValue < purchaseValue;
        });

        if (losingHoldings.length > 0) {
            recommendations.push(`💰 ${losingHoldings.length} holding(s) are at a loss. Consider tax-loss harvesting or holding long-term.`);
        }

        // Default recommendations
        if (recommendations.length === 0) {
            recommendations.push('✅ Your portfolio appears well-balanced. Continue monitoring and rebalancing as needed.');
            recommendations.push('💡 Consider setting up automatic rebalancing to maintain your target allocations.');
        }

        const list = document.getElementById('recommendations-list');
        list.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
    }

    // Modal Management
    openAddHoldingModal() {
        document.getElementById('add-holding-modal').classList.add('show');
        document.getElementById('coin-search').focus();
    }

    editHoldingModal(id) {
        const holding = this.portfolio.find(h => h.id === id);
        if (!holding) return;

        // Populate form
        document.getElementById('edit-holding-id').value = holding.id;
        document.getElementById('edit-coin-search').value = holding.coinName;
        document.getElementById('edit-selected-coin-id').value = holding.coinId;
        document.getElementById('edit-amount').value = holding.amount;
        document.getElementById('edit-purchase-price').value = holding.purchasePrice;
        document.getElementById('edit-purchase-date').value = holding.purchaseDate;
        document.getElementById('edit-notes').value = holding.notes;

        // Update display
        const display = document.getElementById('edit-selected-coin-display');
        display.innerHTML = `
            <div class="selected-coin-info">
                <img src="https://assets.coingecko.com/coins/images/${this.getCoinImageId(holding.coinId)}/thumb/${holding.coinId}.png"
                     alt="${holding.coinName}" width="32" height="32" onerror="this.style.display='none'">
                <div>
                    <div style="font-weight: 600;">${holding.coinName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${holding.coinSymbol}</div>
                </div>
            </div>
        `;

        document.getElementById('edit-holding-modal').classList.add('show');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
        document.querySelectorAll('form').forEach(form => form.reset());
        document.querySelectorAll('.selected-coin-display').forEach(display => {
            display.innerHTML = '<span class="no-coin">No coin selected</span>';
        });
        this.hideCoinSuggestions();
    }

    // Form Handlers
    async handleAddHolding(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const holding = {
            coinId: formData.get('coin-id'),
            amount: formData.get('amount'),
            purchasePrice: formData.get('purchase-price'),
            purchaseDate: formData.get('purchase-date'),
            notes: formData.get('notes')
        };

        if (!holding.coinId || !holding.amount || !holding.purchasePrice) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        await this.addHolding(holding);
    }

    // Search and Filter
    filterHoldings(query) {
        const rows = document.querySelectorAll('#holdings-table tbody tr');
        const lowerQuery = query.toLowerCase();

        rows.forEach(row => {
            if (row.classList.contains('empty-row')) return;

            const coinName = row.querySelector('.coin-name').textContent.toLowerCase();
            const coinSymbol = row.querySelector('.coin-symbol').textContent.toLowerCase();

            if (coinName.includes(lowerQuery) || coinSymbol.includes(lowerQuery)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    sortHoldings(criteria) {
        const sorted = [...this.portfolio].sort((a, b) => {
            switch (criteria) {
                case 'name':
                    return a.coinName.localeCompare(b.coinName);
                case 'value':
                    return (b.amount * (b.currentPrice || 0)) - (a.amount * (a.currentPrice || 0));
                case 'pnl':
                    const aPnL = (a.amount * (a.currentPrice || 0)) - (a.amount * a.purchasePrice);
                    const bPnL = (b.amount * (b.currentPrice || 0)) - (b.amount * b.purchasePrice);
                    return bPnL - aPnL;
                case 'change':
                    return (b.priceChange24h || 0) - (a.priceChange24h || 0);
                default:
                    return 0;
            }
        });

        this.portfolio = sorted;
        this.renderPortfolio();
    }

    // Export Functionality
    exportData() {
        try {
            const data = {
                portfolio: this.portfolio,
                exportDate: new Date().toISOString(),
                totalValue: this.portfolio.reduce((sum, h) => sum + (h.amount * (h.currentPrice || 0)), 0),
                summary: {
                    holdingsCount: this.portfolio.length,
                    lastUpdate: this.lastUpdate
                }
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `crypto-portfolio-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Portfolio data exported successfully', 'success');

        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Failed to export data', 'error');
        }
    }

    // Auto Update
    startAutoUpdate() {
        // Update prices every 5 minutes
        setInterval(() => {
            this.updatePrices();
        }, 5 * 60 * 1000);
    }

    async manualRefresh() {
        await this.updatePrices();
        this.renderPortfolio();
        this.renderCharts();
        this.updateRiskAnalysis();
        this.showToast('Prices updated successfully', 'success');
    }

    // UI Helpers
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        document.getElementById('loading-text').textContent = message;
        overlay.classList.add('show');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('show');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.getElementById('toast-container').appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    updateLastUpdateDisplay() {
        const element = document.getElementById('last-update');
        if (element && this.lastUpdate) {
            element.textContent = `Last updated: ${this.lastUpdate.toLocaleTimeString()}`;
        }
    }

    // Keyboard Shortcuts
    handleKeyboard(e) {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-input').focus();
        }

        // Ctrl/Cmd + N: Add new holding
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.openAddHoldingModal();
        }

        // Escape: Close modal
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }
}

// Initialize the application
const app = new CryptoPortfolioSimulator();

// Make app globally available for onclick handlers
window.app = app;