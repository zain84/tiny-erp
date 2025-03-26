// Transaction Launcher for Tiny-ERP
// Handles launching different transaction types in separate windows

Vue.component('transaction-launcher', {
  data() {
    return {
      transactionTypes: [
        // Masters Module
        {
          id: 'company',
          name: 'Company',
          category: 'Masters',
          component: 'company-transaction',
          icon: 'building'
        },
        {
          id: 'customer-group',
          name: 'Customer Group',
          category: 'Masters',
          component: 'customer-group-transaction',
          icon: 'users'
        },
        {
          id: 'customer',
          name: 'Customer',
          category: 'Masters',
          component: 'customer-transaction',
          icon: 'user-tie'
        },
        {
          id: 'item-category',
          name: 'Item Category',
          category: 'Masters',
          component: 'item-category-transaction',
          icon: 'tags'
        },
        {
          id: 'item-unit',
          name: 'Item Unit',
          category: 'Masters',
          component: 'item-unit-transaction',
          icon: 'ruler'
        },
        {
          id: 'item',
          name: 'Item/Product',
          category: 'Masters',
          component: 'item-transaction',
          icon: 'box'
        },
        {
          id: 'supplier',
          name: 'Supplier',
          category: 'Masters',
          component: 'supplier-transaction',
          icon: 'truck'
        },
        {
          id: 'location',
          name: 'Location',
          category: 'Masters',
          component: 'location-transaction',
          icon: 'warehouse'
        },
        
        // Purchasing Module
        {
          id: 'purchase-order',
          name: 'Purchase Order',
          category: 'Purchasing',
          component: 'purchase-order-transaction',
          icon: 'file-alt'
        },
        {
          id: 'purchase-invoice',
          name: 'Purchase Invoice',
          category: 'Purchasing',
          component: 'purchase-invoice-transaction',
          icon: 'file-invoice-dollar'
        },
        {
          id: 'purchase-return',
          name: 'Purchase Return',
          category: 'Purchasing',
          component: 'purchase-return-transaction',
          icon: 'undo'
        },
        {
          id: 'accounts-payable-purchasing',
          name: 'Accounts Payable',
          category: 'Purchasing',
          component: 'accounts-payable-transaction',
          icon: 'money-bill-wave'
        },
        
        // Sales Module
        {
          id: 'sales-order',
          name: 'Sales Order',
          category: 'Sales',
          component: 'sales-order-transaction',
          icon: 'file-alt'
        },
        {
          id: 'sales-invoice',
          name: 'Sales Invoice',
          category: 'Sales',
          component: 'sales-invoice-transaction',
          icon: 'file-invoice-dollar'
        },
        {
          id: 'sales-return',
          name: 'Sales Return',
          category: 'Sales',
          component: 'sales-return-transaction',
          icon: 'undo'
        },
        {
          id: 'accounts-receivable-sales',
          name: 'Accounts Receivable',
          category: 'Sales',
          component: 'accounts-receivable-transaction',
          icon: 'money-bill-wave'
        },
        
        // Accounting Module
        {
          id: 'general-ledger',
          name: 'General Ledger',
          category: 'Accounting',
          component: 'general-ledger-transaction',
          icon: 'book'
        },
        {
          id: 'accounts-receivable-accounting',
          name: 'Accounts Receivable',
          category: 'Accounting',
          component: 'accounts-receivable-accounting-transaction',
          icon: 'hand-holding-usd'
        },
        {
          id: 'accounts-payable-accounting',
          name: 'Accounts Payable',
          category: 'Accounting',
          component: 'accounts-payable-accounting-transaction',
          icon: 'credit-card'
        }
      ],
      categories: ['Masters', 'Purchasing', 'Sales', 'Accounting'],
      searchQuery: '',
      showLauncher: false
    };
  },
  computed: {
    filteredTransactions() {
      if (!this.searchQuery) {
        return this.transactionTypes;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.transactionTypes.filter(transaction => 
        transaction.name.toLowerCase().includes(query) || 
        transaction.category.toLowerCase().includes(query)
      );
    },
    groupedTransactions() {
      const grouped = {};
      
      this.categories.forEach(category => {
        grouped[category] = this.filteredTransactions.filter(
          transaction => transaction.category === category
        );
      });
      
      return grouped;
    }
  },
  methods: {
    // Launch a transaction in a new window
    launchTransaction(transaction) {
      // Create window with transaction component
      this.$root.createWindow({
        title: transaction.name,
        component: transaction.component,
        componentProps: {
          mode: 'list'
        }
      });
      
      // Hide launcher
      this.showLauncher = false;
      
      // Reset search
      this.searchQuery = '';
    },
    
    // Toggle launcher visibility
    toggleLauncher() {
      this.showLauncher = !this.showLauncher;
      
      if (this.showLauncher) {
        // Focus search input when launcher is shown
        this.$nextTick(() => {
          this.$refs.searchInput.focus();
        });
      }
    },
    
    // Handle keyboard shortcuts
    handleKeyDown(event) {
      // Alt+N to open launcher
      if (event.altKey && event.key === 'n') {
        this.toggleLauncher();
        event.preventDefault();
      }
      
      // Escape to close launcher
      if (event.key === 'Escape' && this.showLauncher) {
        this.showLauncher = false;
        event.preventDefault();
      }
    }
  },
  mounted() {
    // Add global keyboard listener
    document.addEventListener('keydown', this.handleKeyDown);
  },
  beforeDestroy() {
    // Remove global keyboard listener
    document.removeEventListener('keydown', this.handleKeyDown);
  },
  template: `
    <div class="transaction-launcher">
      <!-- Launcher Button -->
      <button 
        type="button" 
        class="btn btn-primary launcher-button"
        @click="toggleLauncher"
        title="New Transaction (Alt+N)"
      >
        <i class="fas fa-plus"></i> New Transaction
      </button>
      
      <!-- Launcher Modal -->
      <div v-if="showLauncher" class="launcher-modal-backdrop" @click="showLauncher = false">
        <div class="launcher-modal card" @click.stop>
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Launch Transaction</h5>
          </div>
          <div class="card-body">
            <div class="form-group">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">
                    <i class="fas fa-search"></i>
                  </span>
                </div>
                <input 
                  ref="searchInput"
                  type="text" 
                  class="form-control" 
                  placeholder="Search transactions..." 
                  v-model="searchQuery"
                >
              </div>
            </div>
            
            <div class="launcher-transactions">
              <div v-for="category in categories" :key="category" class="launcher-category">
                <h6 v-if="groupedTransactions[category].length > 0" class="category-title">{{ category }}</h6>
                <div class="transaction-grid">
                  <div 
                    v-for="transaction in groupedTransactions[category]" 
                    :key="transaction.id"
                    class="transaction-item"
                    @click="launchTransaction(transaction)"
                  >
                    <div class="transaction-icon">
                      <i :class="'fas fa-' + transaction.icon"></i>
                    </div>
                    <div class="transaction-name">{{ transaction.name }}</div>
                  </div>
                </div>
              </div>
              
              <div v-if="filteredTransactions.length === 0" class="text-center py-4">
                <p class="text-muted">No transactions found matching "{{ searchQuery }}"</p>
              </div>
            </div>
          </div>
          <div class="card-footer text-muted">
            <small>Press Escape to close or Alt+N to toggle launcher</small>
          </div>
        </div>
      </div>
    </div>
  `
});
