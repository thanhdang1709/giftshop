/**
 * Analytics module for the admin dashboard
 * Handles sales reports, customer analytics, and data visualization
 */

const AnalyticsManager = {
    // Chart instances
    salesChart: null,
    customersChart: null,
    productPerformanceChart: null,
    
    // Configuration
    timeRange: 'week', // week, month, year
    currency: 'VND',
    
    /**
     * Initialize the analytics dashboard
     */
    init: function() {
        this.setupEventListeners();
        this.loadSalesSummary();
        this.loadTopProducts();
        this.loadCustomerStats();
        this.initCharts();
    },
    
    /**
     * Set up event listeners for the analytics dashboard
     */
    setupEventListeners: function() {
        // Time range selector
        document.querySelectorAll('.time-range-selector').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const timeRange = e.target.dataset.range;
                this.changeTimeRange(timeRange);
                
                // Update active state
                document.querySelectorAll('.time-range-selector').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });
        
        // Export report button
        const exportBtn = document.getElementById('export-analytics-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportReport();
            });
        }
        
        // Print report button
        const printBtn = document.getElementById('print-analytics-btn');
        if (printBtn) {
            printBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.printReport();
            });
        }
    },
    
    /**
     * Change the time range for analytics
     * @param {string} range - The time range (week, month, year)
     */
    changeTimeRange: function(range) {
        this.timeRange = range;
        
        // Update all analytics data based on new time range
        this.loadSalesSummary();
        this.loadTopProducts();
        this.loadCustomerStats();
        this.updateCharts();
        
        // Show notification
        Utils.showToast('info', `Analytics data updated for ${range} view`);
    },
    
    /**
     * Load sales summary data
     */
    loadSalesSummary: function() {
        // In a real application, this would fetch data from the server
        // Here we'll simulate the data for demonstration
        
        let salesData;
        
        // Simulate different data for different time ranges
        if (this.timeRange === 'week') {
            salesData = {
                totalSales: 45600000,
                orderCount: 127,
                averageOrder: 359055,
                comparisonRate: 12.7, // percent increase from previous period
                refundRate: 2.1
            };
        } else if (this.timeRange === 'month') {
            salesData = {
                totalSales: 178900000,
                orderCount: 523,
                averageOrder: 342066,
                comparisonRate: 8.3,
                refundRate: 2.5
            };
        } else { // year
            salesData = {
                totalSales: 2150000000,
                orderCount: 6284,
                averageOrder: 342140,
                comparisonRate: 15.2,
                refundRate: 2.3
            };
        }
        
        // Update the DOM with the new data
        document.getElementById('total-sales').textContent = Utils.formatCurrency(salesData.totalSales);
        document.getElementById('order-count').textContent = salesData.orderCount;
        document.getElementById('average-order').textContent = Utils.formatCurrency(salesData.averageOrder);
        
        // Update comparison indicator
        const comparisonElement = document.getElementById('sales-comparison');
        if (comparisonElement) {
            const isPositive = salesData.comparisonRate > 0;
            comparisonElement.innerHTML = `
                <span class="${isPositive ? 'text-success' : 'text-danger'}">
                    <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i>
                    ${Math.abs(salesData.comparisonRate)}%
                </span> from previous ${this.timeRange}
            `;
        }
        
        // Update refund rate
        document.getElementById('refund-rate').textContent = `${salesData.refundRate}%`;
    },
    
    /**
     * Load top performing products
     */
    loadTopProducts: function() {
        // Simulate top products data
        const topProducts = [
            { id: 1, name: 'Organic Mountain Coffee', sales: 3780000, quantity: 126 },
            { id: 2, name: 'Premium Tea Collection', sales: 2940000, quantity: 98 },
            { id: 3, name: 'Handcrafted Ceramic Mug', sales: 2550000, quantity: 85 },
            { id: 4, name: 'Coffee Brewing Kit', sales: 1920000, quantity: 32 },
            { id: 5, name: 'Specialty Coffee Beans', sales: 1680000, quantity: 56 }
        ];
        
        // Update the DOM with the top products
        const topProductsList = document.getElementById('top-products-list');
        if (topProductsList) {
            topProductsList.innerHTML = '';
            
            topProducts.forEach(product => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
                    <div>
                        <h6 class="mb-0">${product.name}</h6>
                        <small class="text-muted">${product.quantity} units sold</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">${Utils.formatCurrency(product.sales)}</span>
                `;
                topProductsList.appendChild(listItem);
            });
        }
    },
    
    /**
     * Load customer statistics
     */
    loadCustomerStats: function() {
        // Simulate customer stats
        let customerStats;
        
        if (this.timeRange === 'week') {
            customerStats = {
                newCustomers: 45,
                returningRate: 64,
                averageSpend: 401000,
                cartAbandonment: 23.5
            };
        } else if (this.timeRange === 'month') {
            customerStats = {
                newCustomers: 187,
                returningRate: 58,
                averageSpend: 375000,
                cartAbandonment: 25.7
            };
        } else { // year
            customerStats = {
                newCustomers: 2240,
                returningRate: 52,
                averageSpend: 390000,
                cartAbandonment: 24.2
            };
        }
        
        // Update the DOM with customer stats
        document.getElementById('new-customers').textContent = customerStats.newCustomers;
        document.getElementById('returning-rate').textContent = `${customerStats.returningRate}%`;
        document.getElementById('average-spend').textContent = Utils.formatCurrency(customerStats.averageSpend);
        document.getElementById('cart-abandonment').textContent = `${customerStats.cartAbandonment}%`;
    },
    
    /**
     * Initialize all charts
     */
    initCharts: function() {
        this.initSalesChart();
        this.initCustomersChart();
        this.initProductPerformanceChart();
    },
    
    /**
     * Initialize the sales chart
     */
    initSalesChart: function() {
        const ctx = document.getElementById('sales-chart').getContext('2d');
        
        // Generate data based on time range
        const labels = this.generateTimeLabels();
        const data = this.generateRandomData(labels.length, 3000000, 9000000);
        
        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales',
                    data: data,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value, 'vi-VN', 'VND').replace(/\D00(?=\D*$)/, '');
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Initialize the customers chart
     */
    initCustomersChart: function() {
        const ctx = document.getElementById('customers-chart').getContext('2d');
        
        // Generate data based on time range
        const labels = this.generateTimeLabels();
        const newCustomersData = this.generateRandomData(labels.length, 5, 20);
        const returningData = this.generateRandomData(labels.length, 15, 45);
        
        this.customersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'New Customers',
                        data: newCustomersData,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Returning Customers',
                        data: returningData,
                        backgroundColor: 'rgba(153, 102, 255, 0.7)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true
                    }
                }
            }
        });
    },
    
    /**
     * Initialize the product performance chart
     */
    initProductPerformanceChart: function() {
        const ctx = document.getElementById('product-performance-chart').getContext('2d');
        
        this.productPerformanceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Organic Mountain Coffee', 'Premium Tea Collection', 'Handcrafted Ceramic Mug', 'Coffee Brewing Kit', 'Other Products'],
                datasets: [{
                    data: [30, 22, 18, 12, 18],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },
    
    /**
     * Update all charts when time range changes
     */
    updateCharts: function() {
        this.updateSalesChart();
        this.updateCustomersChart();
        // Product performance chart doesn't change with time range
    },
    
    /**
     * Update the sales chart data
     */
    updateSalesChart: function() {
        const labels = this.generateTimeLabels();
        const data = this.generateRandomData(labels.length, 3000000, 9000000);
        
        this.salesChart.data.labels = labels;
        this.salesChart.data.datasets[0].data = data;
        this.salesChart.update();
    },
    
    /**
     * Update the customers chart data
     */
    updateCustomersChart: function() {
        const labels = this.generateTimeLabels();
        const newCustomersData = this.generateRandomData(labels.length, 5, 20);
        const returningData = this.generateRandomData(labels.length, 15, 45);
        
        this.customersChart.data.labels = labels;
        this.customersChart.data.datasets[0].data = newCustomersData;
        this.customersChart.data.datasets[1].data = returningData;
        this.customersChart.update();
    },
    
    /**
     * Generate time labels based on the selected time range
     * @returns {Array} - Array of time labels
     */
    generateTimeLabels: function() {
        const labels = [];
        
        if (this.timeRange === 'week') {
            labels.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
        } else if (this.timeRange === 'month') {
            // Generate last 30 days
            const today = new Date();
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                labels.push(date.getDate().toString());
            }
        } else { // year
            labels.push('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
        }
        
        return labels;
    },
    
    /**
     * Generate random data for charts
     * @param {number} count - Number of data points
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {Array} - Array of random values
     */
    generateRandomData: function(count, min, max) {
        const data = [];
        
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        
        return data;
    },
    
    /**
     * Export analytics report
     */
    exportReport: function() {
        // In a real application, this would generate a PDF or Excel file
        Utils.showToast('info', 'Exporting analytics report...');
        
        // Simulate export delay
        setTimeout(() => {
            Utils.showToast('success', 'Analytics report exported successfully');
        }, 1500);
    },
    
    /**
     * Print analytics dashboard
     */
    printReport: function() {
        Utils.showToast('info', 'Preparing report for printing...');
        
        // In a real application, this would format the page for printing
        setTimeout(() => {
            window.print();
        }, 500);
    }
};

// Initialize the module when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    AnalyticsManager.init();
}); 