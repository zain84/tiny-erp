// Data Table Component for Tiny-ERP
// Reusable component for displaying tabular data with sorting and selection

Vue.component('data-table', {
  props: {
    // Array of data objects to display
    data: {
      type: Array,
      required: true
    },
    // Array of column definitions
    columns: {
      type: Array,
      required: true
      // Each column should have: { key, label, sortable, formatter }
    },
    // Currently selected row ID
    selectedId: {
      type: [String, Number],
      default: null
    },
    // Key to use as unique identifier
    idKey: {
      type: String,
      default: 'id'
    },
    // Whether to show row selection
    selectable: {
      type: Boolean,
      default: true
    },
    // Whether to show action buttons
    showActions: {
      type: Boolean,
      default: true
    },
    // Custom action buttons
    customActions: {
      type: Array,
      default: () => []
      // Each action should have: { icon, label, handler, class }
    }
  },
  data() {
    return {
      sortKey: '',
      sortDirection: 'asc'
    };
  },
  computed: {
    sortedData() {
      const data = [...this.data];
      
      if (this.sortKey) {
        data.sort((a, b) => {
          const aValue = a[this.sortKey];
          const bValue = b[this.sortKey];
          
          // Handle null/undefined values
          if (aValue === undefined || aValue === null) return this.sortDirection === 'asc' ? -1 : 1;
          if (bValue === undefined || bValue === null) return this.sortDirection === 'asc' ? 1 : -1;
          
          // Compare based on data type
          if (typeof aValue === 'string') {
            return this.sortDirection === 'asc' 
              ? aValue.localeCompare(bValue) 
              : bValue.localeCompare(aValue);
          } else {
            return this.sortDirection === 'asc' 
              ? aValue - bValue 
              : bValue - aValue;
          }
        });
      }
      
      return data;
    }
  },
  methods: {
    // Sort table by column
    sortBy(key) {
      if (this.sortKey === key) {
        // Toggle direction if already sorting by this key
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        // Set new sort key and default to ascending
        this.sortKey = key;
        this.sortDirection = 'asc';
      }
    },
    
    // Format cell value based on column definition
    formatCell(row, column) {
      const value = row[column.key];
      
      if (column.formatter) {
        return column.formatter(value, row);
      }
      
      if (value === null || value === undefined) {
        return '';
      }
      
      return value;
    },
    
    // Handle row selection
    selectRow(row) {
      if (!this.selectable) return;
      
      const id = row[this.idKey];
      this.$emit('row-selected', id);
    },
    
    // Handle edit action
    editRow(row) {
      this.$emit('edit', row[this.idKey]);
    },
    
    // Handle delete action
    deleteRow(row) {
      this.$emit('delete', row[this.idKey]);
    },
    
    // Handle custom action
    handleCustomAction(action, row) {
      if (action.handler) {
        action.handler(row);
      }
    }
  },
  template: `
    <div class="data-table-container">
      <table class="data-table table table-hover">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" @click="column.sortable ? sortBy(column.key) : null">
              {{ column.label }}
              <span v-if="column.sortable && sortKey === column.key">
                <i class="fas" :class="sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
              </span>
              <span v-else-if="column.sortable">
                <i class="fas fa-sort text-muted"></i>
              </span>
            </th>
            <th v-if="showActions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="row in sortedData" 
            :key="row[idKey]"
            :class="{ 'selected': selectedId === row[idKey] }"
            @click="selectRow(row)"
          >
            <td v-for="column in columns" :key="column.key">
              {{ formatCell(row, column) }}
            </td>
            <td v-if="showActions" @click.stop class="action-buttons">
              <button 
                v-for="action in customActions" 
                :key="action.label"
                class="btn btn-sm"
                :class="action.class || 'btn-outline-secondary'"
                @click="handleCustomAction(action, row)"
                :title="action.label"
              >
                <i :class="'fas ' + action.icon"></i>
              </button>
              <button class="btn btn-sm btn-info" @click="editRow(row)" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" @click="deleteRow(row)" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="sortedData.length === 0">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="text-center py-3">
              No data available
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
});
