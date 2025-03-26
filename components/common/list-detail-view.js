// List-Detail View Component for Tiny-ERP
// Reusable component for displaying a list on the left and details on the right

Vue.component('list-detail-view', {
  props: {
    // Title for the list section
    listTitle: {
      type: String,
      default: 'Items'
    },
    // Array of items to display in the list
    items: {
      type: Array,
      required: true
    },
    // Currently selected item ID
    selectedId: {
      type: [String, Number],
      default: null
    },
    // Key to use as unique identifier
    idKey: {
      type: String,
      default: 'id'
    },
    // Key to use as display text
    textKey: {
      type: String,
      default: 'name'
    },
    // Whether to show the "New" button
    showNewButton: {
      type: Boolean,
      default: true
    },
    // Whether to show search box
    showSearch: {
      type: Boolean,
      default: true
    },
    // Loading state for list
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchQuery: ''
    };
  },
  computed: {
    filteredItems() {
      if (!this.searchQuery) {
        return this.items;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.items.filter(item => {
        const text = item[this.textKey];
        return text && text.toLowerCase().includes(query);
      });
    }
  },
  methods: {
    selectItem(id) {
      this.$emit('item-selected', id);
    },
    createNew() {
      this.$emit('create-new');
    }
  },
  template: `
    <div class="list-detail-container">
      <!-- List View -->
      <div class="list-view">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>{{ listTitle }}</h5>
          <button v-if="showNewButton" class="btn btn-sm btn-primary" @click="createNew">
            <i class="fas fa-plus"></i> New
          </button>
        </div>
        
        <!-- Search Box -->
        <div v-if="showSearch" class="input-group mb-3">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search..." 
            v-model="searchQuery"
          >
          <div class="input-group-append">
            <span class="input-group-text">
              <i class="fas fa-search"></i>
            </span>
          </div>
        </div>
        
        <!-- Loading Indicator -->
        <div v-if="loading" class="text-center py-3">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="sr-only">Loading...</span>
          </div>
        </div>
        
        <!-- Item List -->
        <div v-else-if="filteredItems.length > 0" class="list-group">
          <a 
            v-for="item in filteredItems" 
            :key="item[idKey]"
            href="#" 
            class="list-group-item list-group-item-action"
            :class="{ active: selectedId === item[idKey] }"
            @click.prevent="selectItem(item[idKey])"
          >
            <slot name="list-item" :item="item">
              {{ item[textKey] || item[idKey] }}
            </slot>
          </a>
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-3 text-muted">
          No items found
        </div>
      </div>
      
      <!-- Detail View -->
      <div class="detail-view">
        <slot name="detail"></slot>
      </div>
    </div>
  `
});
