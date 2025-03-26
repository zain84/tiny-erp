// Sales Order Transaction Component for Tiny-ERP
// Standalone transaction screen for sales order management

Vue.component('sales-order-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'salesOrders',
      customers: [],
      locations: [],
      items: [],
      loadingMasterData: false,
      validationRules: {
        customerId: { required: true },
        orderDate: { required: true },
        expectedShipDate: { required: true },
        locationId: { required: true }
      },
      statusOptions: [
        { value: 'draft', text: 'Draft' },
        { value: 'confirmed', text: 'Confirmed' },
        { value: 'processing', text: 'Processing' },
        { value: 'shipped', text: 'Shipped' },
        { value: 'delivered', text: 'Delivered' },
        { value: 'cancelled', text: 'Cancelled' }
      ],
      newItem: {
        itemId: '',
        quantity: 1,
        unitPrice: 0
      }
    };
  },
  computed: {
    customerOptions() {
      return this.customers.map(customer => ({
        value: customer.id,
        text: customer.name
      }));
    },
    locationOptions() {
      return this.locations.map(location => ({
        value: location.id,
        text: location.name
      }));
    },
    itemOptions() {
      return this.items.map(item => ({
        value: item.id,
        text: `${item.name} (${item.sku})`
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
    selectedItem() {
      return this.items.find(item => item.id === this.newItem.itemId);
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
    
    // Load master data (customers, locations, items)
    async loadMasterData() {
      this.loadingMasterData = true;
      
      try {
        // In a real app, this would load from the server
        // For this demo, we'll use our sample data
        const response = await fetch('/data/masters.json');
        if (!response.ok) {
          throw new Error('Failed to load master data');
        }
        
        const data = await response.json();
        this.customers = data.customers || [];
        this.locations = data.locations || [];
        this.items = data.items || [];
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
      
      if (!this.entity.orderDate) {
        this.entity.orderDate = new Date().toISOString().split('T')[0];
      }
      
      if (!this.entity.status) {
        this.entity.status = 'draft';
      }
    },
    
    // Update customer name when customer ID changes
    onCustomerChange() {
      const selectedCustomer = this.customers.find(c => c.id === this.entity.customerId);
      if (selectedCustomer) {
        this.entity.customerName = selectedCustomer.name;
      }
    },
    
    // Update location name when location ID changes
    onLocationChange() {
      const selectedLocation = this.locations.find(l => l.id === this.entity.locationId);
      if (selectedLocation) {
        this.entity.locationName = selectedLocation.name;
      }
    },
    
    // Add item to sales order
    addItem() {
      if (!this.newItem.itemId || this.newItem.quantity <= 0) {
        return;
      }
      
      const item = this.items.find(i => i.id === this.newItem.itemId);
      if (!item) return;
      
      // Check if item already exists in the order
      const existingItemIndex = this.entity.items.findIndex(i => i.itemId === this.newItem.itemId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = this.entity.items[existingItemIndex];
        existingItem.quantity += this.newItem.quantity;
        existingItem.total = existingItem.quantity * existingItem.unitPrice;
        existingItem.taxAmount = (existingItem.total * existingItem.taxRate) / 100;
      } else {
        // Add new item
        const unitPrice = this.newItem.unitPrice > 0 ? this.newItem.unitPrice : item.sellingPrice;
        const total = this.newItem.quantity * unitPrice;
        const taxAmount = (total * item.taxRate) / 100;
        
        this.entity.items.push({
          id: TinyERPHelpers.generateId('SOI'),
          itemId: item.id,
          itemName: item.name,
          description: item.description,
          quantity: this.newItem.quantity,
          unitId: item.unitId,
          unitName: item.unitName,
          unitPrice: unitPrice,
          taxRate: item.taxRate,
          taxAmount: taxAmount,
          total: total + taxAmount
        });
      }
      
      // Update totals
      this.updateTotals();
      
      // Reset new item form
      this.newItem = {
        itemId: '',
        quantity: 1,
        unitPrice: 0
      };
    },
    
    // Remove item from sales order
    removeItem(index) {
      this.entity.items.splice(index, 1);
      this.updateTotals();
    },
    
    // Update order totals
    updateTotals() {
      this.entity.subtotal = this.subtotal;
      this.entity.taxAmount = this.taxAmount;
      this.entity.total = this.total;
    },
    
    // Override saveEntity to update related data before saving
    async saveEntity() {
      this.onCustomerChange();
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
              <div>{{ entity.customerName }}</div>
              <div class="small text-muted">
                {{ TinyERPHelpers.formatDate(entity.orderDate) }} | 
                {{ TinyERPHelpers.formatCurrency(entity.total) }}
              </div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Sales Order Information">
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
                  label="Reference"
                  :error="validationErrors.reference"
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="4">
                <form-date
                  v-model="entity.orderDate"
                  label="Order Date"
                  required
                  :error="validationErrors.orderDate"
                ></form-date>
              </form-col>
              <form-col size="4">
                <form-date
                  v-model="entity.expectedShipDate"
                  label="Expected Ship Date"
                  required
                  :error="validationErrors.expectedShipDate"
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
                  label="Ship From Location"
                  :options="locationOptions"
                  required
                  :disabled="loadingMasterData"
                  :error="validationErrors.locationId"
                  @input="onLocationChange"
                ></form-select>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Order Items">
            <div v-if="validationErrors.items" class="alert alert-danger">
              {{ validationErrors.items }}
            </div>
            
            <div class="mb-3">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">Add Item</h6>
                  <div class="form-row">
                    <div class="col-md-6">
                      <form-select
                        v-model="newItem.itemId"
                        label="Item"
                        :options="itemOptions"
                        :disabled="loadingMasterData"
                      ></form-select>
                    </div>
                    <div class="col-md-2">
                      <form-input
                        v-model.number="newItem.quantity"
                        label="Quantity"
                        type="number"
                        min="1"
                        step="1"
                      ></form-input>
                    </div>
                    <div class="col-md-2">
                      <form-input
                        v-model.number="newItem.unitPrice"
                        label="Unit Price"
                        type="number"
                        min="0"
                        step="0.01"
                        :placeholder="selectedItem ? selectedItem.sellingPrice : ''"
                      ></form-input>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                      <button type="button" class="btn btn-primary btn-block" @click="addItem">
                        <i class="fas fa-plus"></i> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
