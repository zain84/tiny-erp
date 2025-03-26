// Supplier Transaction Component for Tiny-ERP
// Standalone transaction screen for supplier management

Vue.component('supplier-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'suppliers',
      validationRules: {
        name: { required: true, maxLength: 100 },
        email: { required: true, email: true },
        phone: { required: true },
        address: { required: true }
      },
      paymentTermsOptions: [
        { value: 'Net 15', text: 'Net 15' },
        { value: 'Net 30', text: 'Net 30' },
        { value: 'Net 45', text: 'Net 45' },
        { value: 'Net 60', text: 'Net 60' },
        { value: 'Due on Receipt', text: 'Due on Receipt' }
      ]
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
        
        if (rules.email && this.entity[field] && !TinyERPHelpers.isValidEmail(this.entity[field])) {
          this.validationErrors[field] = 'Please enter a valid email address';
        }
        
        if (rules.maxLength && this.entity[field] && this.entity[field].length > rules.maxLength) {
          this.validationErrors[field] = `Maximum length is ${rules.maxLength} characters`;
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
            <div>
              <div class="font-weight-bold">{{ entity.name }}</div>
              <div class="small">{{ entity.email }}</div>
              <div class="small text-muted">{{ entity.phone }}</div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Supplier Information">
            <form-row>
              <form-col size="12">
                <form-input
                  v-model="entity.name"
                  label="Supplier Name"
                  required
                  :error="validationErrors.name"
                ></form-input>
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
          
          <form-section title="Additional Information">
            <form-row>
              <form-col size="6">
                <form-input
                  v-model="entity.contactPerson"
                  label="Contact Person"
                  :error="validationErrors.contactPerson"
                ></form-input>
              </form-col>
              <form-col size="6">
                <form-select
                  v-model="entity.paymentTerms"
                  label="Payment Terms"
                  :options="paymentTermsOptions"
                  :error="validationErrors.paymentTerms"
                ></form-select>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="6">
                <form-input
                  v-model="entity.website"
                  label="Website"
                  :error="validationErrors.website"
                ></form-input>
              </form-col>
              <form-col size="6">
                <form-input
                  v-model="entity.taxId"
                  label="Tax ID"
                  :error="validationErrors.taxId"
                ></form-input>
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
