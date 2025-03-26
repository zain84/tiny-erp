// Item Categories Transaction Component for Tiny-ERP
// Standalone transaction screen for item category management

Vue.component('item-category-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'itemCategories',
      validationRules: {
        name: { required: true, maxLength: 50 }
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
        <template v-slot:form>
          <form-section title="Item Category Information">
            <form-row>
              <form-col size="12">
                <form-input
                  v-model="entity.name"
                  label="Category Name"
                  required
                  :error="validationErrors.name"
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
