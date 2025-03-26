// Company Transaction Component for Tiny-ERP
// Standalone transaction screen for company management

Vue.component('company-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'companies',
      validationRules: {
        name: { required: true, maxLength: 100 },
        email: { required: true, email: true },
        phone: { required: true },
        address: { required: true }
      }
    };
  },
  methods: {
    // Override validate method from base-transaction
    validate() {
      this.validationErrors = {};
      
      // Validate required fields
      for (const [field, rules] of Object.entries(this.validationRules)) {
        if (rules.required && !this.entity[field]) {
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
    },
    
    // Load company data
    async loadCompanyData() {
      try {
        // In a real app, this would load from the server
        // For this demo, we'll use our sample data
        const response = await fetch('/data/masters.json');
        if (!response.ok) {
          throw new Error('Failed to load company data');
        }
        
        const data = await response.json();
        if (data.companies && data.companies.length > 0) {
          this.entity = data.companies[0];
          this.selectedId = this.entity.id;
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        this.error = 'Failed to load company data';
      }
    }
  },
  created() {
    // If no initial data provided, load the default company
    if (!this.initialData.id) {
      this.loadCompanyData();
    }
  },
  template: `
    <div>
      <base-transaction
        :entity-type="entityType"
        :initial-data="initialData"
        :mode="mode"
        :list-detail-view="false"
        @save="$emit('save', $event)"
        @close="$emit('close')"
      >
        <template v-slot:form>
          <form-section title="Company Information">
            <form-row>
              <form-col size="6">
                <form-input
                  v-model="entity.name"
                  label="Company Name"
                  required
                  :error="validationErrors.name"
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
                  v-model="entity.website"
                  label="Website"
                  :error="validationErrors.website"
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
