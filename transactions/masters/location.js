// Location Transaction Component for Tiny-ERP
// Standalone transaction screen for stock/line location management

Vue.component('location-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'locations',
      validationRules: {
        name: { required: true, maxLength: 100 },
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
        if (rules.required && (this.entity[field] === undefined || this.entity[field] === null || this.entity[field] === '')) {
          this.validationErrors[field] = `${field} is required`;
        }
        
        if (rules.maxLength && this.entity[field] && this.entity[field].length > rules.maxLength) {
          this.validationErrors[field] = `Maximum length is ${rules.maxLength} characters`;
        }
      }
      
      return Object.keys(this.validationErrors).length === 0;
    },
    
    // Override saveEntity to handle default location logic
    async saveEntity() {
      // If setting this location as default, we should ideally update all other locations
      // In a real app, this would be handled by the backend
      if (this.entity.isDefault) {
        console.log('Setting as default location:', this.entity.name);
      }
      
      return await this.$refs.baseTransaction.saveEntity();
    }
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
              <div class="font-weight-bold">
                {{ entity.name }}
                <span v-if="entity.isDefault" class="badge badge-success ml-2">Default</span>
              </div>
              <div class="small text-muted">{{ entity.description }}</div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="Location Information">
            <form-row>
              <form-col size="12">
                <form-input
                  v-model="entity.name"
                  label="Location Name"
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
                <form-textarea
                  v-model="entity.address"
                  label="Address"
                  required
                  :error="validationErrors.address"
                ></form-textarea>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="6">
                <form-input
                  v-model="entity.phone"
                  label="Phone"
                  :error="validationErrors.phone"
                ></form-input>
              </form-col>
              <form-col size="6">
                <form-checkbox
                  v-model="entity.isDefault"
                  label="Set as Default Location"
                ></form-checkbox>
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
