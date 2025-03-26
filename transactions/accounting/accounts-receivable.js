// Accounts Receivable Accounting Component for Tiny-ERP
// Standalone transaction screen for accounts receivable accounting management

Vue.component('accounts-receivable-accounting-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'accountsReceivable',
      customers: [],
      salesInvoices: [],
      chartOfAccounts: [],
      accountingPeriods: [],
      loadingMasterData: false,
      validationRules: {
        customerId: { required: true },
        fromDate: { required: true },
        toDate: { required: true }
      },
      selectedCustomerId: '',
      receivables: [],
      agingPeriods: [
        { name: 'Current', days: [0, 30], total: 0 },
        { name: '31-60 Days', days: [31, 60], total: 0 },
        { name: '61-90 Days', days: [61, 90], total: 0 },
        { name: 'Over 90 Days', days: [91, Infinity], total: 0 }
      ],
      totalReceivables: 0,
      selectedInvoice: null,
      paymentHistory: []
    };
  },
  computed: {
    customerOptions() {
      return [
        { value: '', text: 'All Customers' },
        ...this.customers.map(customer => ({
          value: customer.id,
          text: customer.name
        }))
      ];
    },
    filteredReceivables() {
      if (!this.selectedCustomerId) {
        return this.receivables;
      }
      return this.receivables.filter(r => r.customerId === this.selectedCustomerId);
    }
  },
  methods: {
    // Load master data (customers, sales invoices, chart of accounts)
    async loadMasterData() {
      this.loadingMasterData = true;
      
      try {
        // Load customers
        const mastersResponse = await fetch('/data/masters.json');
        if (!mastersResponse.ok) {
          throw new Error('Failed to load master data');
        }
        
        const mastersData = await mastersResponse.json();
        this.customers = mastersData.customers || [];
        
        // Load sales invoices and accounts receivable
        const salesResponse = await fetch('/data/sales.json');
        if (!salesResponse.ok) {
          throw new Error('Failed to load sales data');
        }
        
        const salesData = await salesResponse.json();
        this.salesInvoices = salesData.salesInvoices || [];
        
        // Combine sales invoices and accounts receivable
        const accountsReceivable = salesData.accountsReceivable || [];
        this.receivables = [
          ...this.salesInvoices.filter(si => si.status !== 'paid' && si.status !== 'cancelled'),
          ...accountsReceivable.filter(ar => ar.status !== 'paid' && ar.status !== 'cancelled')
        ];
        
        // Load chart of accounts
        const accountingResponse = await fetch('/data/accounting.json');
        if (!accountingResponse.ok) {
          throw new Error('Failed to load accounting data');
        }
        
        const accountingData = await accountingResponse.json();
        this.chartOfAccounts = accountingData.chartOfAccounts || [];
        this.accountingPeriods = accountingData.accountingPeriods || [];
        
        // Calculate aging totals
        this.calculateAgingTotals();
      } catch (error) {
        console.error('Error loading master data:', error);
        this.error = 'Failed to load master data';
      } finally {
        this.loadingMasterData = false;
      }
    },
    
    // Calculate aging totals
    calculateAgingTotals() {
      const today = new Date();
      
      // Reset totals
      this.agingPeriods.forEach(period => {
        period.total = 0;
      });
      
      this.totalReceivables = 0;
      
      // Calculate days overdue and assign to aging periods
      this.receivables.forEach(receivable => {
        if (!receivable.dueDate) return;
        
        const dueDate = new Date(receivable.dueDate);
        const diffTime = Math.abs(today - dueDate);
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Find appropriate aging period
        const agingPeriod = this.agingPeriods.find(period => 
          daysOverdue >= period.days[0] && daysOverdue <= period.days[1]
        );
        
        if (agingPeriod) {
          const balance = receivable.total - (receivable.amountPaid || 0);
          agingPeriod.total += balance;
          this.totalReceivables += balance;
        }
      });
    },
    
    // Filter receivables by customer
    filterByCustomer() {
      this.calculateAgingTotals();
    },
    
    // View invoice details
    viewInvoiceDetails(invoice) {
      this.selectedInvoice = invoice;
      
      // Get payment history
      this.paymentHistory = invoice.paymentHistory || [];
    },
    
    // Close invoice details
    closeInvoiceDetails() {
      this.selectedInvoice = null;
      this.paymentHistory = [];
    },
    
    // Generate aging report
    generateAgingReport() {
      // In a real app, this would generate a PDF or Excel report
      alert('Aging report would be generated here.');
    },
    
    // Generate statement for customer
    generateStatement(customerId) {
      const customer = this.customers.find(c => c.id === customerId);
      if (!customer) return;
      
      // In a real app, this would generate a PDF statement
      alert(`Statement would be generated for ${customer.name}.`);
    }
  },
  created() {
    // Load master data
    this.loadMasterData();
    
    // Set default date range (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.entity.fromDate = firstDay.toISOString().split('T')[0];
    this.entity.toDate = lastDay.toISOString().split('T')[0];
  },
  template: `
    <div>
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Accounts Receivable</h5>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-4">
              <form-select
                v-model="selectedCustomerId"
                label="Customer"
                :options="customerOptions"
                :disabled="loadingMasterData"
                @input="filterByCustomer"
              ></form-select>
            </div>
            <div class="col-md-3">
              <form-date
                v-model="entity.fromDate"
                label="From Date"
                required
                :error="validationErrors.fromDate"
              ></form-date>
            </div>
            <div class="col-md-3">
              <form-date
                v-model="entity.toDate"
                label="To Date"
                required
                :error="validationErrors.toDate"
              ></form-date>
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button type="button" class="btn btn-success btn-block" @click="generateAgingReport">
                <i class="fas fa-file-export"></i> Export Report
              </button>
            </div>
          </div>
          
          <!-- Aging Summary -->
          <div class="card mb-4">
            <div class="card-header bg-light">
              <h6 class="mb-0">Aging Summary</h6>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th v-for="period in agingPeriods" :key="period.name">{{ period.name }}</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td v-for="period in agingPeriods" :key="period.name" class="text-right">
                        {{ TinyERPHelpers.formatCurrency(period.total) }}
                      </td>
                      <td class="text-right font-weight-bold">
                        {{ TinyERPHelpers.formatCurrency(totalReceivables) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Receivables List -->
          <div v-if="!selectedInvoice">
            <div class="table-responsive">
              <table class="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="receivable in filteredReceivables" :key="receivable.id">
                    <td>{{ receivable.reference || receivable.id }}</td>
                    <td>{{ receivable.customerName }}</td>
                    <td>{{ TinyERPHelpers.formatDate(receivable.invoiceDate) }}</td>
                    <td>{{ TinyERPHelpers.formatDate(receivable.dueDate) }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(receivable.total) }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(receivable.amountPaid || 0) }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(receivable.total - (receivable.amountPaid || 0)) }}</td>
                    <td>
                      <span class="badge" :class="'badge-' + TinyERPHelpers.getStatusBadgeClass(receivable.status)">
                        {{ receivable.status }}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="btn btn-sm btn-info mr-1" @click="viewInvoiceDetails(receivable)">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-primary" @click="generateStatement(receivable.customerId)">
                        <i class="fas fa-file-invoice"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredReceivables.length === 0">
                    <td colspan="9" class="text-center">No receivables found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Invoice Details -->
          <div v-if="selectedInvoice" class="card">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Invoice Details: {{ selectedInvoice.reference || selectedInvoice.id }}</h6>
              <button type="button" class="btn btn-sm btn-secondary" @click="closeInvoiceDetails">
                <i class="fas fa-times"></i> Close
              </button>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <p><strong>Customer:</strong> {{ selectedInvoice.customerName }}</p>
                  <p><strong>Invoice Date:</strong> {{ TinyERPHelpers.formatDate(selectedInvoice.invoiceDate) }}</p>
                  <p><strong>Due Date:</strong> {{ TinyERPHelpers.formatDate(selectedInvoice.dueDate) }}</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Status:</strong> {{ selectedInvoice.status }}</p>
                  <p><strong>Total Amount:</strong> {{ TinyERPHelpers.formatCurrency(selectedInvoice.total) }}</p>
                  <p><strong>Balance:</strong> {{ TinyERPHelpers.formatCurrency(selectedInvoice.total - (selectedInvoice.amountPaid || 0)) }}</p>
                </div>
              </div>
              
              <!-- Payment History -->
              <h6>Payment History</h6>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="payment in paymentHistory" :key="payment.id">
                      <td>{{ TinyERPHelpers.formatDate(payment.date) }}</td>
                      <td class="text-right">{{ TinyERPHelpers.formatCurrency(payment.amount) }}</td>
                      <td>{{ payment.method }}</td>
                      <td>{{ payment.reference }}</td>
                    </tr>
                    <tr v-if="!paymentHistory || paymentHistory.length === 0">
                      <td colspan="4" class="text-center">No payment records</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Invoice Items -->
              <h6>Invoice Items</h6>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Tax</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedInvoice.items" :key="item.id">
                      <td>{{ item.itemName }}</td>
                      <td>{{ item.description }}</td>
                      <td>{{ item.quantity }} {{ item.unitName }}</td>
                      <td class="text-right">{{ TinyERPHelpers.formatCurrency(item.unitPrice) }}</td>
                      <td class="text-right">{{ TinyERPHelpers.formatCurrency(item.taxAmount) }}</td>
                      <td class="text-right">{{ TinyERPHelpers.formatCurrency(item.total) }}</td>
                    </tr>
                    <tr v-if="!selectedInvoice.items || selectedInvoice.items.length === 0">
                      <td colspan="6" class="text-center">No items</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" class="text-right font-weight-bold">Subtotal:</td>
                      <td colspan="2" class="text-right">{{ TinyERPHelpers.formatCurrency(selectedInvoice.subtotal) }}</td>
                    </tr>
                    <tr>
                      <td colspan="4" class="text-right font-weight-bold">Tax:</td>
                      <td colspan="2" class="text-right">{{ TinyERPHelpers.formatCurrency(selectedInvoice.taxAmount) }}</td>
                    </tr>
                    <tr>
                      <td colspan="4" class="text-right font-weight-bold">Total:</td>
                      <td colspan="2" class="text-right font-weight-bold">{{ TinyERPHelpers.formatCurrency(selectedInvoice.total) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
});
