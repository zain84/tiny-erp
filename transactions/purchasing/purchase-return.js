// Purchase Return Transaction Component for Tiny-ERP
// Standalone transaction screen for purchase return management

Vue.component('purchase-return-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'purchaseReturns',
      suppliers: [],
      locations: [],
      purchaseInvoices: [],
      loadingMasterData: false,
      validationRules: {
        supplierId: { required: true },
        returnDate: { required: true },
        locationId: { required: true },
        reason: { required: true }
      },
      statusOptions: [
        { value: 'draft', text: 'Draft' },
        { value: 'pending', text: 'Pending' },
        { value: 'completed', text: 'Completed' },
        { value: 'cancelled', text: 'Cancelled' }
      ],
      reasonOptions: [
        { value: 'Defective product', text: 'Defective product' },
        { value: 'Wrong item received', text: 'Wrong item received' },
        { value: 'Excess quantity', text: 'Excess quantity' },
        { value: 'Damaged in transit', text: 'Damaged in transit' },
        { value: 'Other', text: 'Other' }
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
    purchaseInvoiceOptions() {
      return this.purchaseInvoices
        .filter(pi => pi.supplierId === this.entity.supplierId)
        .map(pi => ({
          value: pi.id,
          text: `${pi.reference || pi.id} (${TinyERPHelpers.formatDate(pi.invoiceDate)})`
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
    
    // Load master data (suppliers, locations, purchase invoices)
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
        
        // Load purchase invoices
        const purchasingResponse = await fetch('/data/purchasing.json');
        if (!purchasingResponse.ok) {
          throw new Error('Failed to load purchasing data');
        }
        
        const purchasingData = await purchasingResponse.json();
        this.purchaseInvoices = purchasingData.purchaseInvoices || [];
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
      
      if (!this.entity.returnDate) {
        this.entity.returnDate = new Date().toISOString().split('T')[0];
      }
      
      if (!this.entity.status) {
        this.entity.status = 'draft';
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
    
    // Load items from purchase invoice
    async loadFromPurchaseInvoice() {
      if (!this.entity.purchaseInvoiceId) return;
      
      const purchaseInvoice = this.purchaseInvoices.find(pi => pi.id === this.entity.purchaseInvoiceId);
      if (!purchaseInvoice) return;
      
      // Show item selection dialog
      const selectedItems = await this.selectItemsFromInvoice(purchaseInvoice.items);
      if (!selectedItems || selectedItems.length === 0) return;
      
      // Add selected items to return
      selectedItems.forEach(item => {
        this.entity.items.push({
          id: TinyERPHelpers.generateId('PRI'),
          itemId: item.itemId,
          itemName: item.itemName,
          description: item.description + ' - Return',
          quantity: item.returnQuantity,
          unitId: item.unitId,
          unitName: item.unitName,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: (item.unitPrice * item.returnQuantity * item.taxRate) / 100,
          total: item.unitPrice * item.returnQuantity * (1 + item.taxRate / 100)
        });
      });
      
      // Update totals
      this.updateTotals();
    },
    
    // Show dialog to select items from invoice
    async selectItemsFromInvoice(invoiceItems) {
      // In a real app, this would be a modal dialog
      // For this demo, we'll use a simple prompt
      const selectedItems = [];
      
      for (const item of invoiceItems) {
        const returnQuantity = parseInt(prompt(
          `Enter return quantity for ${item.itemName} (max: ${item.quantity}):`, 
          '0'
        ));
        
        if (returnQuantity > 0 && returnQuantity <= item.quantity) {
          selectedItems.push({
            ...item,
            returnQuantity
          });
        }
      }
      
      return selectedItems;
    },
    
    // Remove item from return
    removeItem(index) {
      this.entity.items.splice(index, 1);
      this.updateTotals();
    },
    
    // Update return totals
    updateTotals() {
      this.entity.subtotal = this.subtotal;
      this.entity.taxAmount = this.taxAmount;
      this.entity.total = this.total;
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
                {{ TinyERPHelpers.formatDate(entity.returnDate) }} | 
                {{ TinyERPHelpers.formatCurrency(entity.total) }}
              </div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Purchase Return Information">
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
                  label="Return Reference"
                  :error="validationErrors.reference"
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="4">
                <form-date
                  v-model="entity.returnDate"
                  label="Return Date"
                  required
                  :error="validationErrors.returnDate"
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
              <form-col size="4">
                <form-select
                  v-model="entity.reason"
                  label="Return Reason"
                  :options="reasonOptions"
                  required
                  :error="validationErrors.reason"
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
                  v-model="entity.purchaseInvoiceId"
                  label="Purchase Invoice"
                  :options="purchaseInvoiceOptions"
                  :disabled="loadingMasterData || !entity.supplierId"
                  :error="validationErrors.purchaseInvoiceId"
                ></form-select>
                <button 
                  v-if="entity.purchaseInvoiceId" 
                  type="button" 
                  class="btn btn-sm btn-info mt-2"
                  @click="loadFromPurchaseInvoice"
                >
                  Select Items from Invoice
                </button>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Return Items">
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
