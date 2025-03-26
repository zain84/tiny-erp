// Customer Transaction Component for Tiny-ERP
// Standalone transaction screen for customer management

Vue.component('customer-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'customers',
      customerGroups: [],
      loadingGroups: false,
      validationRules: {
        name: { required: true, maxLength: 100 },
        groupId: { required: true },
        email: { required: true, email: true },
        phone: { required: true },
        address: { required: true },
        creditLimit: { min: 0 }
      }
    };
  },
  computed: {
    customerGroupOptions() {
      return this.customerGroups.map(group => ({
        value: group.id,
        text: group.name
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
        
        if (rules.email && this.entity[field] && !TinyERPHelpers.isValidEmail(this.entity[field])) {
          this.validationErrors[field] = 'Please enter a valid email address';
        }
        
        if (rules.maxLength && this.entity[field] && this.entity[field].length > rules.maxLength) {
          this.validationErrors[field] = `Maximum length is ${rules.maxLength} characters`;
        }
        
        if (rules.min !== undefined && this.entity[field] !== undefined && this.entity[field] < rules.min) {
          this.validationErrors[field] = `Minimum value is ${rules.min}`;
        }
      }
      
      return Object.keys(this.validationErrors).length === 0;
    },
    
    // Load customer groups for dropdown
    async loadCustomerGroups() {
      this.loadingGroups = true;
      
      try {
        // In a real app, this would load from the server
        // For this demo, we'll use our sample data
        const response = await fetch('/data/masters.json');
        if (!response.ok) {
          throw new Error('Failed to load customer groups');
        }
        
        const data = await response.json();
        if (data.customerGroups) {
          this.customerGroups = data.customerGroups;
        }
      } catch (error) {
        console.error('Error loading customer groups:', error);
        this.error = 'Failed to load customer groups';
      } finally {
        this.loadingGroups = false;
      }
    },
    
    // Update group name when group ID changes
    onGroupChange() {
      const selectedGroup = this.customerGroups.find(g => g.id === this.entity.groupId);
      if (selectedGroup) {
        this.entity.groupName = selectedGroup.name;
      }
    },
    
    // Override saveEntity to update group name before saving
    async saveEntity() {
      this.onGroupChange();
      return await this.$refs.baseTransaction.saveEntity();
    }
  },
  created() {
    // Load customer groups
    this.loadCustomerGroups();
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
              <div class="small text-muted">{{ entity.groupName }}</div>
              <div class="small">{{ entity.email }}</div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Customer Information">
            <form-row>
              <form-col size="8">
                <form-input
                  v-model="entity.name"
                  label="Customer Name"
                  required
                  :error="validationErrors.name"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-select
                  v-model="entity.groupId"
                  label="Customer Group"
                  :options="customerGroupOptions"
                  required
                  :disabled="loadingGroups"
                  :error="validationErrors.groupId"
                  @input="onGroupChange"
                ></form-select>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="6">
                <form-input
                  v-model="entity.email"
                  label="Email"
                  type="email"
                  required
                  :error="validationErrors.email"
                ></form-input>
              </form-col>
              <form-col size="6">
                <form-input
                  v-model="entity.phone"
                  label="Phone"
                  required
                  :error="validationErrors.phone"
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="12">
                <form-textarea
                  v-model="entity.address"
                  label="Address"
                  required
                  :error="validationErrors.address"
                ></form-textarea>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Financial Information">
            <form-row>
              <form-col size="6">
                <form-input
                  v-model.number="entity.creditLimit"
                  label="Credit Limit"
                  type="number"
                  min="0"
                  step="100"
                  :error="validationErrors.creditLimit"
                ></form-input>
              </form-col>
              <form-col size="6">
                <form-input
                  v-model.number="entity.balance"
                  label="Current Balance"
                  type="number"
                  step="0.01"
                  readonly
                ></form-input>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="6">
                <form-input
                  v-model="entity.taxId"
                  label="Tax ID"
                  :error="validationErrors.taxId"
                ></form-input>
              </form-col>
              <form-col size="6">
                <form-checkbox
                  v-model="entity.active"
                  label="Active"
                ></form-checkbox>
              </form-col>
            </form-row>
          </form-section>
        </template>
      </base-transaction>
    </div>
  `
});
