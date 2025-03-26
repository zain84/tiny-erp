// Customer Group Transaction Component for Tiny-ERP
// Standalone transaction screen for customer group management

Vue.component('customer-group-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'customerGroups',
      validationRules: {
        name: { required: true, maxLength: 50 },
        discountPercent: { required: true, min: 0, max: 100 }
      }
    };
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
        
        if (rules.max !== undefined && this.entity[field] !== undefined && this.entity[field] > rules.max) {
          this.validationErrors[field] = `Maximum value is ${rules.max}`;
        }
      }
      
      return Object.keys(this.validationErrors).length === 0;
    }
  },
  template: `
    <div>
      <base-transaction
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
            <div class="d-flex justify-content-between align-items-center">
              <div>{{ entity.name }}</div>
              <span class="badge badge-primary">{{ entity.discountPercent }}%</span>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Customer Group Information">
            <form-row>
              <form-col size="8">
                <form-input
                  v-model="entity.name"
                  label="Group Name"
                  required
                  :error="validationErrors.name"
                ></form-input>
              </form-col>
              <form-col size="4">
                <form-input
                  v-model.number="entity.discountPercent"
                  label="Discount Percent"
                  type="number"
                  min="0"
                  max="100"
                  required
                  :error="validationErrors.discountPercent"
                ></form-input>
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
            
            <form-row>
              <form-col size="12">
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
