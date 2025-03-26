// Accounts Receivable Transaction Component for Tiny-ERP
// Standalone transaction screen for accounts receivable management

Vue.component('accounts-receivable-transaction', {
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
      loadingMasterData: false,
      validationRules: {
        customerId: { required: true },
        invoiceDate: { required: true },
        dueDate: { required: true },
        total: { required: true, min: 0 }
      },
      statusOptions: [
        { value: 'pending', text: 'Pending' },
        { value: 'partial', text: 'Partially Paid' },
        { value: 'paid', text: 'Paid' },
        { value: 'overdue', text: 'Overdue' },
        { value: 'cancelled', text: 'Cancelled' }
      ],
      paymentHistory: [],
      newPayment: {
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference: ''
      },
      paymentMethods: [
        { value: 'cash', text: 'Cash' },
        { value: 'bank_transfer', text: 'Bank Transfer' },
        { value: 'check', text: 'Check' },
        { value: 'credit_card', text: 'Credit Card' }
      ]
    };
  },
  computed: {
    customerOptions() {
      return this.customers.map(customer => ({
        value: customer.id,
        text: customer.name
      }));
    },
    salesInvoiceOptions() {
      return this.salesInvoices
        .filter(si => si.customerId === this.entity.customerId)
        .map(si => ({
          value: si.id,
          text: `${si.reference || si.id} (${TinyERPHelpers.formatDate(si.invoiceDate)})`
        }));
    },
    balance() {
      return this.entity.total - (this.entity.amountPaid || 0);
    },
    daysOverdue() {
      if (!this.entity.dueDate) return 0;
      
      const today = new Date();
      const dueDate = new Date(this.entity.dueDate);
      
      if (today <= dueDate) return 0;
      
      const diffTime = Math.abs(today - dueDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    isOverdue() {
      return this.daysOverdue > 0 && this.balance > 0;
    }
  },
  methods: {
    // Override validate method from base-transaction
    validate() {
      this.validationErrors = {};
      
      // Validate required fields
      for (const [field, rules] of Object.entries(this.validationRules)) {
        if (rules.required && (this.entity[field] === undefined || this.entity[field] === null || this.entity[field] === '')) {
          this.validationErrors[field] = `${field} is required`;
        }
        
        if (rules.min !== undefined && this.entity[field] !== undefined && this.entity[field] < rules.min) {
          this.validationErrors[field] = `Minimum value is ${rules.min}`;
        }
      }
      
      // Validate payment
      if (this.newPayment.amount > this.balance) {
        this.validationErrors.paymentAmount = 'Payment amount cannot exceed balance';
      }
      
      return Object.keys(this.validationErrors).length === 0;
    },
    
    // Load master data (customers, sales invoices)
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
        
        // Load sales invoices
        const salesResponse = await fetch('/data/sales.json');
        if (!salesResponse.ok) {
          throw new Error('Failed to load sales data');
        }
        
        const salesData = await salesResponse.json();
        this.salesInvoices = salesData.salesInvoices || [];
      } catch (error) {
        console.error('Error loading master data:', error);
        this.error = 'Failed to load master data';
      } finally {
        this.loadingMasterData = false;
      }
    },
    
    // Initialize entity
    initializeEntity() {
      if (!this.entity.invoiceDate) {
        this.entity.invoiceDate = new Date().toISOString().split('T')[0];
      }
      
      if (!this.entity.status) {
        this.entity.status = 'pending';
      }
      
      if (this.entity.amountPaid === undefined) {
        this.entity.amountPaid = 0;
      }
      
      if (!this.entity.paymentHistory) {
        this.entity.paymentHistory = [];
      } else {
        this.paymentHistory = this.entity.paymentHistory;
      }
    },
    
    // Update customer name when customer ID changes
    onCustomerChange() {
      const selectedCustomer = this.customers.find(c => c.id === this.entity.customerId);
      if (selectedCustomer) {
        this.entity.customerName = selectedCustomer.name;
      }
    },
    
    // Load data from sales invoice
    loadFromSalesInvoice() {
      if (!this.entity.salesInvoiceId) return;
      
      const salesInvoice = this.salesInvoices.find(si => si.id === this.entity.salesInvoiceId);
      if (!salesInvoice) return;
      
      // Copy data from sales invoice
      this.entity.invoiceDate = salesInvoice.invoiceDate;
      this.entity.dueDate = salesInvoice.dueDate;
      this.entity.reference = salesInvoice.reference;
      this.entity.subtotal = salesInvoice.subtotal;
      this.entity.taxAmount = salesInvoice.taxAmount;
      this.entity.total = salesInvoice.total;
      
      // Update status
      this.updateStatus();
    },
    
    // Record payment
    recordPayment() {
      if (this.newPayment.amount <= 0 || this.newPayment.amount > this.balance) {
        this.validationErrors.paymentAmount = 'Invalid payment amount';
        return;
      }
      
      // Create payment record
      const payment = {
        id: TinyERPHelpers.generateId('PAY'),
        date: this.newPayment.date,
        amount: this.newPayment.amount,
        method: this.newPayment.method,
        reference: this.newPayment.reference
      };
      
      // Add to payment history
      if (!this.entity.paymentHistory) {
        this.entity.paymentHistory = [];
      }
      
      this.entity.paymentHistory.push(payment);
      this.paymentHistory = this.entity.paymentHistory;
      
      // Update amount paid
      this.entity.amountPaid = (this.entity.amountPaid || 0) + payment.amount;
      
      // Update status
      this.updateStatus();
      
      // Reset new payment form
      this.newPayment = {
        amount: Math.min(this.balance, 0),
        date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference: ''
      };
    },
    
    // Update payment status based on amounts and dates
    updateStatus() {
      if (this.entity.amountPaid >= this.entity.total) {
        this.entity.status = 'paid';
        this.entity.balance = 0;
      } else if (this.entity.amountPaid > 0) {
        this.entity.status = 'partial';
        this.entity.balance = this.balance;
      } else if (this.isOverdue) {
        this.entity.status = 'overdue';
        this.entity.balance = this.balance;
      } else {
        this.entity.status = 'pending';
        this.entity.balance = this.balance;
      }
    },
    
    // Get payment method text
    getPaymentMethodText(method) {
      const found = this.paymentMethods.find(m => m.value === method);
      return found ? found.text : method;
    },
    
    // Override saveEntity to update related data before saving
    async saveEntity() {
      this.onCustomerChange();
      this.updateStatus();
      return await this.$refs.baseTransaction.saveEntity();
    }
  },
  created() {
    // Load master data
    this.loadMasterData();
    
    // Initialize entity
    this.initializeEntity();
  },
  template: `
    <div>
      <base-transaction
        ref="baseTransaction"
        :entity-type="entityType"
        :initial-data="initialData"
        :mode="mode"
        :list-detail-view="true"
        @save="$emit('save', $event)"
        @close="$emit('close')"
      >
        <template v-slot:list-items="{ entities, selectedId }">
          <a 
            v-for="entity in entities" 
            :key="entity.id"
            href="#" 
            class="list-group-item list-group-item-action"
            :class="{ active: selectedId === entity.id }"
            @click.prevent="selectEntity(entity.id)"
          >
            <div>
              <div class="d-flex justify-content-between">
                <span class="font-weight-bold">{{ entity.reference || entity.id }}</span>
                <span class="badge" :class="'badge-' + TinyERPHelpers.getStatusBadgeClass(entity.status)">
                  {{ entity.status }}
                </span>
              </div>
              <div>{{ entity.customerName }}</div>
              <div class="small text-muted">
                Due: {{ TinyERPHelpers.formatDate(entity.dueDate) }} | 
                {{ TinyERPHelpers.formatCurrency(entity.total) }}
              </div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Accounts Receivable Information">
            <form-row>
              <form-col size="6">
                <form-select
                  v-model="entity.customerId"
                  label="Customer"
                  :options="customerOptions"
                  required
                  :disabled="loadingMasterData"
                  :error="validationErrors.customerId"
                  @input="onCustomerChange"
                ></form-select>
              </form-col>
              <form-col size="6">
                <form-input
                  v-model="entity.reference"
                  label="Invoice Reference"
                  :error="validationErrors.reference"
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="4">
                <form-date
                  v-model="entity.invoiceDate"
                  label="Invoice Date"
                  required
                  :error="validationErrors.invoiceDate"
                ></form-date>
              </form-col>
              <form-col size="4">
                <form-date
                  v-model="entity.dueDate"
                  label="Due Date"
                  required
                  :error="validationErrors.dueDate"
                ></form-date>
              </form-col>
              <form-col size="4">
                <form-select
                  v-model="entity.status"
                  label="Status"
                  :options="statusOptions"
                  :error="validationErrors.status"
                ></form-select>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="6">
                <form-select
                  v-model="entity.salesInvoiceId"
                  label="Sales Invoice"
                  :options="salesInvoiceOptions"
                  :disabled="loadingMasterData || !entity.customerId"
                  :error="validationErrors.salesInvoiceId"
                ></form-select>
                <button 
                  v-if="entity.salesInvoiceId" 
                  type="button" 
                  class="btn btn-sm btn-info mt-2"
                  @click="loadFromSalesInvoice"
                >
                  Load Data from Invoice
                </button>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Amount Information">
            <form-row>
              <form-col size="4">
                <form-input
                  v-model.number="entity.subtotal"
                  label="Subtotal"
                  type="number"
                  min="0"
                  step="0.01"
                  :error="validationErrors.subtotal"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  v-model.number="entity.taxAmount"
                  label="Tax Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  :error="validationErrors.taxAmount"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  v-model.number="entity.total"
                  label="Total Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  :error="validationErrors.total"
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="4">
                <form-input
                  v-model.number="entity.amountPaid"
                  label="Amount Paid"
                  type="number"
                  min="0"
                  step="0.01"
                  :error="validationErrors.amountPaid"
                  @input="updateStatus"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  :value="TinyERPHelpers.formatCurrency(balance)"
                  label="Balance"
                  readonly
                ></form-input>
              </form-col>
              <form-col size="4">
                <div v-if="isOverdue" class="alert alert-danger p-2 mb-0">
                  Overdue by {{ daysOverdue }} days
                </div>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Payment History">
            <div class="table-responsive mb-4">
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
                    <td>{{ TinyERPHelpers.formatCurrency(payment.amount) }}</td>
                    <td>{{ getPaymentMethodText(payment.method) }}</td>
                    <td>{{ payment.reference }}</td>
                  </tr>
                  <tr v-if="!paymentHistory || paymentHistory.length === 0">
                    <td colspan="4" class="text-center">No payment records</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="card mb-3">
              <div class="card-body">
                <h6 class="card-title">Record Payment</h6>
                <div class="form-row">
                  <div class="col-md-3">
                    <form-date
                      v-model="newPayment.date"
                      label="Payment Date"
                    ></form-date>
                  </div>
                  <div class="col-md-3">
                    <form-input
                      v-model.number="newPayment.amount"
                      label="Amount"
                      type="number"
                      min="0.01"
                      :max="balance"
                      step="0.01"
                      :error="validationErrors.paymentAmount"
                    ></form-input>
                  </div>
                  <div class="col-md-3">
                    <form-select
                      v-model="newPayment.method"
                      label="Payment Method"
                      :options="paymentMethods"
                    ></form-select>
                  </div>
                  <div class="col-md-3">
                    <form-input
                      v-model="newPayment.reference"
                      label="Reference"
                    ></form-input>
                  </div>
                </div>
                <div class="text-right mt-3">
                  <button 
                    type="button" 
                    class="btn btn-success"
                    @click="recordPayment"
                    :disabled="balance <= 0 || newPayment.amount <= 0"
                  >
                    <i class="fas fa-money-bill-wave"></i> Record Payment
                  </button>
                </div>
              </div>
            </div>
          </form-section>
          
          <form-section title="Additional Information">
            <form-row>
              <form-col size="12">
                <form-textarea
                  v-model="entity.notes"
                  label="Notes"
                  :error="validationErrors.notes"
                ></form-textarea>
              </form-col>
            </form-row>
          </form-section>
        </template>
      </base-transaction>
    </div>
  `
});
