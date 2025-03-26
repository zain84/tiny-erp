// Accounts Payable Accounting Component for Tiny-ERP
// Standalone transaction screen for accounts payable accounting management

Vue.component('accounts-payable-accounting-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'accountsPayable',
      suppliers: [],
      purchaseInvoices: [],
      chartOfAccounts: [],
      accountingPeriods: [],
      loadingMasterData: false,
      validationRules: {
        supplierId: { required: true },
        fromDate: { required: true },
        toDate: { required: true }
      },
      selectedSupplierId: '',
      payables: [],
      agingPeriods: [
        { name: 'Current', days: [0, 30], total: 0 },
        { name: '31-60 Days', days: [31, 60], total: 0 },
        { name: '61-90 Days', days: [61, 90], total: 0 },
        { name: 'Over 90 Days', days: [91, Infinity], total: 0 }
      ],
      totalPayables: 0,
      selectedInvoice: null,
      paymentHistory: []
    };
  },
  computed: {
    supplierOptions() {
      return [
        { value: '', text: 'All Suppliers' },
        ...this.suppliers.map(supplier => ({
          value: supplier.id,
          text: supplier.name
        }))
      ];
    },
    filteredPayables() {
      if (!this.selectedSupplierId) {
        return this.payables;
      }
      return this.payables.filter(p => p.supplierId === this.selectedSupplierId);
    }
  },
  methods: {
    // Load master data (suppliers, purchase invoices, chart of accounts)
    async loadMasterData() {
      this.loadingMasterData = true;
      
      try {
        // Load suppliers
        const mastersResponse = await fetch('/data/masters.json');
        if (!mastersResponse.ok) {
          throw new Error('Failed to load master data');
        }
        
        const mastersData = await mastersResponse.json();
        this.suppliers = mastersData.suppliers || [];
        
        // Load purchase invoices and accounts payable
        const purchasingResponse = await fetch('/data/purchasing.json');
        if (!purchasingResponse.ok) {
          throw new Error('Failed to load purchasing data');
        }
        
        const purchasingData = await purchasingResponse.json();
        this.purchaseInvoices = purchasingData.purchaseInvoices || [];
        
        // Combine purchase invoices and accounts payable
        const accountsPayable = purchasingData.accountsPayable || [];
        this.payables = [
          ...this.purchaseInvoices.filter(pi => pi.status !== 'paid' && pi.status !== 'cancelled'),
          ...accountsPayable.filter(ap => ap.status !== 'paid' && ap.status !== 'cancelled')
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
      
      this.totalPayables = 0;
      
      // Calculate days overdue and assign to aging periods
      this.payables.forEach(payable => {
        if (!payable.dueDate) return;
        
        const dueDate = new Date(payable.dueDate);
        const diffTime = Math.abs(today - dueDate);
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Find appropriate aging period
        const agingPeriod = this.agingPeriods.find(period => 
          daysOverdue >= period.days[0] && daysOverdue <= period.days[1]
        );
        
        if (agingPeriod) {
          const balance = payable.total - (payable.amountPaid || 0);
          agingPeriod.total += balance;
          this.totalPayables += balance;
        }
      });
    },
    
    // Filter payables by supplier
    filterBySupplier() {
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
    
    // Schedule payment
    schedulePayment(invoice) {
      const balance = invoice.total - (invoice.amountPaid || 0);
      if (balance <= 0) return;
      
      // In a real app, this would open a payment scheduling dialog
      const paymentDate = prompt('Enter payment date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
      if (!paymentDate) return;
      
      alert(`Payment of ${TinyERPHelpers.formatCurrency(balance)} scheduled for ${paymentDate}.`);
    },
    
    // Generate payment batch
    generatePaymentBatch() {
      // In a real app, this would generate a payment batch for selected invoices
      alert('Payment batch would be generated here.');
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
          <h5 class="mb-0">Accounts Payable</h5>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-4">
              <form-select
                v-model="selectedSupplierId"
                label="Supplier"
                :options="supplierOptions"
                :disabled="loadingMasterData"
                @input="filterBySupplier"
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
                        {{ TinyERPHelpers.formatCurrency(totalPayables) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Payables List -->
          <div v-if="!selectedInvoice">
            <div class="d-flex justify-content-end mb-3">
              <button type="button" class="btn btn-primary" @click="generatePaymentBatch">
                <i class="fas fa-money-check"></i> Generate Payment Batch
              </button>
            </div>
            
            <div class="table-responsive">
              <table class="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Supplier</th>
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
                  <tr v-for="payable in filteredPayables" :key="payable.id">
                    <td>{{ payable.reference || payable.id }}</td>
                    <td>{{ payable.supplierName }}</td>
                    <td>{{ TinyERPHelpers.formatDate(payable.invoiceDate) }}</td>
                    <td>{{ TinyERPHelpers.formatDate(payable.dueDate) }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(payable.total) }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(payable.amountPaid || 0) }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(payable.total - (payable.amountPaid || 0)) }}</td>
                    <td>
                      <span class="badge" :class="'badge-' + TinyERPHelpers.getStatusBadgeClass(payable.status)">
                        {{ payable.status }}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="btn btn-sm btn-info mr-1" @click="viewInvoiceDetails(payable)">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-success" 
                        @click="schedulePayment(payable)"
                        :disabled="payable.status === 'paid'"
                      >
                        <i class="fas fa-calendar-check"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredPayables.length === 0">
                    <td colspan="9" class="text-center">No payables found</td>
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
                  <p><strong>Supplier:</strong> {{ selectedInvoice.supplierName }}</p>
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
