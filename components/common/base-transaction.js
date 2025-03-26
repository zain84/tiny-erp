// Base Transaction Component for Tiny-ERP
// This is the foundation for all transaction screens

Vue.component('base-transaction', {
  props: {
    // Initial data for the transaction
    initialData: {
      type: Object,
      default: () => ({})
    },
    // Entity type (e.g., 'customer', 'item', 'purchase-order')
    entityType: {
      type: String,
      required: true
    },
    // Mode: 'create', 'edit', 'view'
    mode: {
      type: String,
      default: 'create'
    },
    // Whether to show in list-detail view
    listDetailView: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // Current entity data
      entity: {},
      // List of entities for list view
      entities: [],
      // Loading states
      loading: false,
      loadingList: false,
      saving: false,
      // Error handling
      error: null,
      // Form validation
      validationErrors: {},
      // Selected entity ID for list view
      selectedId: null,
      // Search and filter
      searchQuery: '',
      filters: {}
    };
  },
  computed: {
    // Whether the form is in edit mode
    isEditMode() {
      return this.mode === 'edit';
    },
    // Whether the form is in view-only mode
    isViewMode() {
      return this.mode === 'view';
    },
    // Whether the form is in create mode
    isCreateMode() {
      return this.mode === 'create';
    },
    // Whether the form has validation errors
    hasErrors() {
      return Object.keys(this.validationErrors).length > 0;
    },
    // Filtered entities based on search query and filters
    filteredEntities() {
      if (!this.searchQuery && Object.keys(this.filters).length === 0) {
        return this.entities;
      }
      
      return this.entities.filter(entity => {
        // Apply search query
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          const matchesSearch = Object.values(entity).some(value => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(query);
            }
            return false;
          });
          
          if (!matchesSearch) return false;
        }
        
        // Apply filters
        for (const [key, value] of Object.entries(this.filters)) {
          if (value && entity[key] !== value) {
            return false;
          }
        }
        
        return true;
      });
    }
  },
  methods: {
    // Load entity by ID
    async loadEntity(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const entity = await DataService.getById(this.entityType, id);
        if (entity) {
          this.entity = entity;
          this.selectedId = id;
        } else {
          this.error = `${this.entityType} not found`;
        }
      } catch (error) {
        this.error = `Error loading ${this.entityType}: ${error.message}`;
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    
    // Load list of entities
    async loadEntities() {
      this.loadingList = true;
      
      try {
        this.entities = await DataService.loadData(this.entityType);
      } catch (error) {
        console.error(`Error loading ${this.entityType} list:`, error);
        this.entities = [];
      } finally {
        this.loadingList = false;
      }
    },
    
    // Save current entity
    async saveEntity() {
      if (this.hasErrors) return;
      
      this.saving = true;
      
      try {
        const savedEntity = await DataService.saveData(this.entityType, this.entity);
        this.entity = savedEntity;
        
        // Update list if in list-detail view
        if (this.listDetailView) {
          await this.loadEntities();
        }
        
        // Switch to edit mode after create
        if (this.isCreateMode) {
          this.mode = 'edit';
        }
        
        this.selectedId = savedEntity.id;
        
        // Emit save event
        this.$emit('save', savedEntity);
        
        return savedEntity;
      } catch (error) {
        this.error = `Error saving ${this.entityType}: ${error.message}`;
        console.error(error);
        return null;
      } finally {
        this.saving = false;
      }
    },
    
    // Delete entity
    async deleteEntity(id) {
      if (!confirm(`Are you sure you want to delete this ${this.entityType}?`)) {
        return false;
      }
      
      try {
        await DataService.deleteData(this.entityType, id || this.entity.id);
        
        // Update list if in list-detail view
        if (this.listDetailView) {
          await this.loadEntities();
        }
        
        // Clear selection if deleted current entity
        if (this.selectedId === id) {
          this.selectedId = null;
          this.entity = {};
        }
        
        // Emit delete event
        this.$emit('delete', id);
        
        return true;
      } catch (error) {
        this.error = `Error deleting ${this.entityType}: ${error.message}`;
        console.error(error);
        return false;
      }
    },
    
    // Select entity from list
    selectEntity(id) {
      if (this.selectedId === id) return;
      
      this.loadEntity(id);
    },
    
    // Create new entity
    createNew() {
      this.entity = {};
      this.selectedId = null;
      this.mode = 'create';
      this.error = null;
      this.validationErrors = {};
    },
    
    // Validate form fields
    validate() {
      // This should be overridden by child components
      return true;
    },
    
    // Close transaction
    close() {
      this.$emit('close');
    },
    
    // Reset form to initial state
    reset() {
      this.entity = { ...this.initialData };
      this.error = null;
      this.validationErrors = {};
    }
  },
  created() {
    // Initialize entity with initial data
    this.entity = { ...this.initialData };
    
    // Load entities if in list-detail view
    if (this.listDetailView) {
      this.loadEntities();
    }
    
    // Load entity if in edit or view mode and has ID
    if ((this.isEditMode || this.isViewMode) && this.initialData.id) {
      this.loadEntity(this.initialData.id);
    }
  },
  template: `
    <div class="base-transaction">
      <!-- Error Alert -->
      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="close" @click="error = null">
          <span>&times;</span>
        </button>
      </div>
      
      <!-- List-Detail View -->
      <div v-if="listDetailView" class="list-detail-container">
        <!-- List View -->
        <div class="list-view">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5>{{ entityType }} List</h5>
            <button class="btn btn-sm btn-primary" @click="createNew">
              <i class="fas fa-plus"></i> New
            </button>
          </div>
          
          <!-- Search Box -->
          <div class="input-group mb-3">
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
          <div v-if="loadingList" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="sr-only">Loading...</span>
            </div>
          </div>
          
          <!-- Entity List -->
          <div v-else-if="filteredEntities.length > 0" class="list-group">
            <slot name="list-items" :entities="filteredEntities" :selected-id="selectedId">
              <!-- Default list rendering if no slot provided -->
              <a 
                v-for="entity in filteredEntities" 
                :key="entity.id"
                href="#" 
                class="list-group-item list-group-item-action"
                :class="{ active: selectedId === entity.id }"
                @click.prevent="selectEntity(entity.id)"
              >
                {{ entity.name || entity.id }}
              </a>
            </slot>
          </div>
          
          <!-- Empty State -->
          <div v-else class="text-center py-3 text-muted">
            No items found
          </div>
        </div>
        
        <!-- Detail View -->
        <div class="detail-view">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="sr-only">Loading...</span>
            </div>
          </div>
          
          <div v-else>
            <!-- Form Title -->
            <h4 class="mb-4">
              {{ isCreateMode ? 'New' : isViewMode ? 'View' : 'Edit' }} {{ entityType }}
            </h4>
            
            <!-- Form Content -->
            <slot name="form"></slot>
            
            <!-- Form Actions -->
            <div class="mt-4 d-flex justify-content-between">
              <div>
                <button 
                  v-if="!isCreateMode" 
                  class="btn btn-danger" 
                  @click="deleteEntity(entity.id)"
                  :disabled="saving"
                >
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
              
              <div>
                <button class="btn btn-secondary mr-2" @click="reset">
                  <i class="fas fa-undo"></i> Reset
                </button>
                <button 
                  v-if="!isViewMode" 
                  class="btn btn-primary" 
                  @click="saveEntity"
                  :disabled="saving || hasErrors"
                >
                  <i class="fas fa-save"></i> {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Single Form View (no list) -->
      <div v-else>
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
          </div>
        </div>
        
        <div v-else>
          <!-- Form Title -->
          <h4 class="mb-4">
            {{ isCreateMode ? 'New' : isViewMode ? 'View' : 'Edit' }} {{ entityType }}
          </h4>
          
          <!-- Form Content -->
          <slot name="form"></slot>
          
          <!-- Form Actions -->
          <div class="mt-4 d-flex justify-content-between">
            <div>
              <button 
                v-if="!isCreateMode" 
                class="btn btn-danger" 
                @click="deleteEntity(entity.id)"
                :disabled="saving"
              >
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
            
            <div>
              <button class="btn btn-secondary mr-2" @click="reset">
                <i class="fas fa-undo"></i> Reset
              </button>
              <button 
                v-if="!isViewMode" 
                class="btn btn-primary" 
                @click="saveEntity"
                :disabled="saving || hasErrors"
              >
                <i class="fas fa-save"></i> {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
});
