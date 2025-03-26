// Purchase Invoice Transaction Component for Tiny-ERP
// Standalone transaction screen for purchase invoice management

Vue.component('purchase-invoice-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'purchaseInvoices',
      suppliers: [],
      locations: [],
      purchaseOrders: [],
      loadingMasterData: false,
      validationRules: {
        supplierId: { required: true },
        invoiceDate: { required: true },
        dueDate: { required: true },
        locationId: { required: true }
      },
      statusOptions: [
        { value: 'draft', text: 'Draft' },
        { value: 'pending', text: 'Pending Payment' },
        { value: 'partial', text: 'Partially Paid' },
        { value: 'paid', text: 'Paid' },
        { value: 'cancelled', text: 'Cancelled' }
      ]
    };
  },
  computed: {
    supplierOptions() {
      return this.suppliers.map(supplier => ({
        value: supplier.id,
        text: supplier.name
      }));
    },
    locationOptions() {
      return this.locations.map(location => ({
        value: location.id,
        text: location.name
      }));
    },
    purchaseOrderOptions() {
      return this.purchaseOrders
        .filter(po => po.supplierId === this.entity.supplierId)
        .map(po => ({
          value: po.id,
          text: `${po.reference || po.id} (${TinyERPHelpers.formatDate(po.orderDate)})`
        }));
    },
    subtotal() {
      if (!this.entity.items) return 0;
      return this.entity.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    },
    taxAmount() {
      if (!this.entity.items) return 0;
      return this.entity.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const taxAmount = (itemTotal * item.taxRate) / 100;
        return sum + taxAmount;
      }, 0);
    },
    total() {
      return this.subtotal + this.taxAmount;
    },
    balance() {
      return this.total - (this.entity.amountPaid || 0);
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
      }
      
      // Validate items
      if (!this.entity.items || this.entity.items.length === 0) {
        this.validationErrors.items = 'At least one item is required';
      }
      
      return Object.keys(this.validationErrors).length === 0;
    },
    
    // Load master data (suppliers, locations, purchase orders)
    async loadMasterData() {
      this.loadingMasterData = true;
      
      try {
        // Load suppliers and locations
        const mastersResponse = await fetch('/data/masters.json');
        if (!mastersResponse.ok) {
          throw new Error('Failed to load master data');
        }
        
        const mastersData = await mastersResponse.json();
        this.suppliers = mastersData.suppliers || [];
        this.locations = mastersData.locations || [];
        
        // Load purchase orders
        const purchasingResponse = await fetch('/data/purchasing.json');
        if (!purchasingResponse.ok) {
          throw new Error('Failed to load purchasing data');
        }
        
        const purchasingData = await purchasingResponse.json();
        this.purchaseOrders = purchasingData.purchaseOrders || [];
      } catch (error) {
        console.error('Error loading master data:', error);
        this.error = 'Failed to load master data';
      } finally {
        this.loadingMasterData = false;
      }
    },
    
    // Initialize entity
    initializeEntity() {
      if (!this.entity.items) {
        this.entity.items = [];
      }
      
      if (!this.entity.invoiceDate) {
        this.entity.invoiceDate = new Date().toISOString().split('T')[0];
      }
      
      if (!this.entity.status) {
        this.entity.status = 'draft';
      }
      
      if (this.entity.amountPaid === undefined) {
        this.entity.amountPaid = 0;
      }
    },
    
    // Update supplier name when supplier ID changes
    onSupplierChange() {
      const selectedSupplier = this.suppliers.find(s => s.id === this.entity.supplierId);
      if (selectedSupplier) {
        this.entity.supplierName = selectedSupplier.name;
      }
    },
    
    // Update location name when location ID changes
    onLocationChange() {
      const selectedLocation = this.locations.find(l => l.id === this.entity.locationId);
      if (selectedLocation) {
        this.entity.locationName = selectedLocation.name;
      }
    },
    
    // Load items from purchase order
    async loadFromPurchaseOrder() {
      if (!this.entity.purchaseOrderId) return;
      
      const purchaseOrder = this.purchaseOrders.find(po => po.id === this.entity.purchaseOrderId);
      if (!purchaseOrder) return;
      
      // Copy items from purchase order
      this.entity.items = JSON.parse(JSON.stringify(purchaseOrder.items));
      
      // Update IDs to make them unique for this invoice
      this.entity.items.forEach(item => {
        item.id = TinyERPHelpers.generateId('PII');
      });
      
      // Update totals
      this.updateTotals();
    },
    
    // Remove item from invoice
    removeItem(index) {
      this.entity.items.splice(index, 1);
      this.updateTotals();
    },
    
    // Update invoice totals
    updateTotals() {
      this.entity.subtotal = this.subtotal;
      this.entity.taxAmount = this.taxAmount;
      this.entity.total = this.total;
      this.entity.balance = this.balance;
      
      // Update status based on payment
      if (this.entity.amountPaid === 0) {
        this.entity.status = 'pending';
      } else if (this.entity.amountPaid < this.entity.total) {
        this.entity.status = 'partial';
      } else if (this.entity.amountPaid >= this.entity.total) {
        this.entity.status = 'paid';
        this.entity.balance = 0;
      }
    },
    
    // Record payment
    recordPayment() {
      const remainingBalance = this.entity.total - (this.entity.amountPaid || 0);
      if (remainingBalance <= 0) return;
      
      const paymentAmount = parseFloat(prompt('Enter payment amount:', remainingBalance.toFixed(2)));
      if (isNaN(paymentAmount) || paymentAmount <= 0) return;
      
      this.entity.amountPaid = (this.entity.amountPaid || 0) + paymentAmount;
      this.updateTotals();
    },
    
    // Override saveEntity to update related data before saving
    async saveEntity() {
      this.onSupplierChange();
      this.onLocationChange();
      this.updateTotals();
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
              <div>{{ entity.supplierName }}</div>
              <div class="small text-muted">
                {{ TinyERPHelpers.formatDate(entity.invoiceDate) }} | 
                {{ TinyERPHelpers.formatCurrency(entity.total) }}
              </div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Purchase Invoice Information">
            <form-row>
              <form-col size="6">
                <form-select
                  v-model="entity.supplierId"
                  label="Supplier"
                  :options="supplierOptions"
                  required
                  :disabled="loadingMasterData"
                  :error="validationErrors.supplierId"
                  @input="onSupplierChange"
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
                  v-model="entity.locationId"
                  label="Location"
                  :options="locationOptions"
                  required
                  :disabled="loadingMasterData"
                  :error="validationErrors.locationId"
                  @input="onLocationChange"
                ></form-select>
              </form-col>
              <form-col size="6">
                <form-select
                  v-model="entity.purchaseOrderId"
                  label="Purchase Order"
                  :options="purchaseOrderOptions"
                  :disabled="loadingMasterData || !entity.supplierId"
                  :error="validationErrors.purchaseOrderId"
                ></form-select>
                <button 
                  v-if="entity.purchaseOrderId" 
                  type="button" 
                  class="btn btn-sm btn-info mt-2"
                  @click="loadFromPurchaseOrder"
                >
                  Load Items from Purchase Order
                </button>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Invoice Items">
            <div v-if="validationErrors.items" class="alert alert-danger">
              {{ validationErrors.items }}
            </div>
            
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Tax Rate</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in entity.items" :key="item.id || index">
                    <td>
                      {{ item.itemName }}
                      <div class="small text-muted">{{ item.description }}</div>
                    </td>
                    <td>{{ item.quantity }} {{ item.unitName }}</td>
                    <td>{{ TinyERPHelpers.formatCurrency(item.unitPrice) }}</td>
                    <td>{{ item.taxRate }}%</td>
                    <td>{{ TinyERPHelpers.formatCurrency(item.total) }}</td>
                    <td>
                      <button type="button" class="btn btn-sm btn-danger" @click="removeItem(index)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!entity.items || entity.items.length === 0">
                    <td colspan="6" class="text-center">No items added</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right font-weight-bold">Subtotal:</td>
                    <td>{{ TinyERPHelpers.formatCurrency(subtotal) }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="4" class="text-right font-weight-bold">Tax:</td>
                    <td>{{ TinyERPHelpers.formatCurrency(taxAmount) }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="4" class="text-right font-weight-bold">Total:</td>
                    <td class="font-weight-bold">{{ TinyERPHelpers.formatCurrency(total) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </form-section>
          
          <form-section title="Payment Information">
            <form-row>
              <form-col size="4">
                <form-input
                  v-model.number="entity.amountPaid"
                  label="Amount Paid"
                  type="number"
                  min="0"
                  step="0.01"
                  :error="validationErrors.amountPaid"
                  @input="updateTotals"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  :value="TinyERPHelpers.formatCurrency(balance)"
                  label="Balance"
                  readonly
                ></form-input>
              </form-col>
              <form-col size="4" class="d-flex align-items-end">
                <button 
                  type="button" 
                  class="btn btn-success btn-block"
                  @click="recordPayment"
                  :disabled="balance <= 0"
                >
                  <i class="fas fa-money-bill-wave"></i> Record Payment
                </button>
              </form-col>
            </form-row>
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
