// Item Transaction Component for Tiny-ERP
// Standalone transaction screen for product/item management

Vue.component('item-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'items',
      categories: [],
      units: [],
      loadingCategories: false,
      loadingUnits: false,
      validationRules: {
        name: { required: true, maxLength: 100 },
        categoryId: { required: true },
        unitId: { required: true },
        sku: { required: true, maxLength: 20 },
        costPrice: { required: true, min: 0 },
        sellingPrice: { required: true, min: 0 }
      }
    };
  },
  computed: {
    categoryOptions() {
      return this.categories.map(category => ({
        value: category.id,
        text: category.name
      }));
    },
    unitOptions() {
      return this.units.map(unit => ({
        value: unit.id,
        text: `${unit.name} (${unit.abbreviation})`
      }));
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
        
        if (rules.maxLength && this.entity[field] && this.entity[field].length > rules.maxLength) {
          this.validationErrors[field] = `Maximum length is ${rules.maxLength} characters`;
        }
        
        if (rules.min !== undefined && this.entity[field] !== undefined && this.entity[field] < rules.min) {
          this.validationErrors[field] = `Minimum value is ${rules.min}`;
        }
      }
      
      // Additional validation
      if (this.entity.sellingPrice < this.entity.costPrice) {
        this.validationErrors.sellingPrice = 'Selling price should be greater than or equal to cost price';
      }
      
      return Object.keys(this.validationErrors).length === 0;
    },
    
    // Load categories and units for dropdowns
    async loadMasterData() {
      this.loadingCategories = true;
      this.loadingUnits = true;
      
      try {
        // In a real app, this would load from the server
        // For this demo, we'll use our sample data
        const response = await fetch('/data/masters.json');
        if (!response.ok) {
          throw new Error('Failed to load master data');
        }
        
        const data = await response.json();
        if (data.itemCategories) {
          this.categories = data.itemCategories;
        }
        if (data.itemUnits) {
          this.units = data.itemUnits;
        }
      } catch (error) {
        console.error('Error loading master data:', error);
        this.error = 'Failed to load master data';
      } finally {
        this.loadingCategories = false;
        this.loadingUnits = false;
      }
    },
    
    // Update category name when category ID changes
    onCategoryChange() {
      const selectedCategory = this.categories.find(c => c.id === this.entity.categoryId);
      if (selectedCategory) {
        this.entity.categoryName = selectedCategory.name;
      }
    },
    
    // Update unit name when unit ID changes
    onUnitChange() {
      const selectedUnit = this.units.find(u => u.id === this.entity.unitId);
      if (selectedUnit) {
        this.entity.unitName = selectedUnit.name;
      }
    },
    
    // Override saveEntity to update related names before saving
    async saveEntity() {
      this.onCategoryChange();
      this.onUnitChange();
      return await this.$refs.baseTransaction.saveEntity();
    },
    
    // Generate profit margin percentage
    calculateMargin() {
      if (!this.entity.costPrice || !this.entity.sellingPrice) return 0;
      
      const costPrice = parseFloat(this.entity.costPrice);
      const sellingPrice = parseFloat(this.entity.sellingPrice);
      
      if (costPrice === 0) return 100;
      
      const margin = ((sellingPrice - costPrice) / costPrice) * 100;
      return Math.round(margin * 100) / 100; // Round to 2 decimal places
    }
  },
  created() {
    // Load master data
    this.loadMasterData();
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
              <div class="font-weight-bold">{{ entity.name }}</div>
              <div class="small text-muted">{{ entity.categoryName }} | {{ entity.sku }}</div>
              <div class="small">{{ TinyERPHelpers.formatCurrency(entity.sellingPrice) }}</div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Basic Information">
            <form-row>
              <form-col size="8">
                <form-input
                  v-model="entity.name"
                  label="Item Name"
                  required
                  :error="validationErrors.name"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  v-model="entity.sku"
                  label="SKU"
                  required
                  :error="validationErrors.sku"
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="6">
                <form-select
                  v-model="entity.categoryId"
                  label="Category"
                  :options="categoryOptions"
                  required
                  :disabled="loadingCategories"
                  :error="validationErrors.categoryId"
                  @input="onCategoryChange"
                ></form-select>
              </form-col>
              <form-col size="6">
                <form-select
                  v-model="entity.unitId"
                  label="Unit"
                  :options="unitOptions"
                  required
                  :disabled="loadingUnits"
                  :error="validationErrors.unitId"
                  @input="onUnitChange"
                ></form-select>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="12">
                <form-textarea
                  v-model="entity.description"
                  label="Description"
                  :error="validationErrors.description"
                ></form-textarea>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Pricing Information">
            <form-row>
              <form-col size="4">
                <form-input
                  v-model.number="entity.costPrice"
                  label="Cost Price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  :error="validationErrors.costPrice"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  v-model.number="entity.sellingPrice"
                  label="Selling Price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  :error="validationErrors.sellingPrice"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  :value="calculateMargin() + '%'"
                  label="Profit Margin"
                  readonly
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="4">
                <form-input
                  v-model.number="entity.taxRate"
                  label="Tax Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :error="validationErrors.taxRate"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  v-model="entity.barcode"
                  label="Barcode"
                  :error="validationErrors.barcode"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-checkbox
                  v-model="entity.active"
                  label="Active"
                ></form-checkbox>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Inventory Information">
            <form-row>
              <form-col size="4">
                <form-input
                  v-model.number="entity.inStock"
                  label="Current Stock"
                  type="number"
                  min="0"
                  step="1"
                  :error="validationErrors.inStock"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  v-model.number="entity.reorderLevel"
                  label="Reorder Level"
                  type="number"
                  min="0"
                  step="1"
                  :error="validationErrors.reorderLevel"
                ></form-input>
              </form-col>
            </form-row>
          </form-section>
        </template>
      </base-transaction>
    </div>
  `
});
