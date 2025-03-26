// Data Service for Tiny-ERP
// This service handles data loading and saving for all transactions

const DataService = {
  /**
   * Load data from JSON file
   * @param {string} entity - Entity name (e.g., 'customers', 'items')
   * @returns {Promise} - Promise resolving to data array
   */
  async loadData(entity) {
    try {
      // In a real application, this would be an API call
      // For this demo, we'll simulate loading from local JSON files
      const response = await fetch(`/data/${entity}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${entity} data`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading ${entity} data:`, error);
      // Return empty array as fallback
      return [];
    }
  },

  /**
   * Save data
   * @param {string} entity - Entity name (e.g., 'customers', 'items')
   * @param {Object} data - Data to save
   * @returns {Promise} - Promise resolving to saved data
   */
  async saveData(entity, data) {
    try {
      // In a real application, this would be an API call
      // For this demo, we'll simulate saving by logging to console
      console.log(`Saving ${entity} data:`, data);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return data with ID if it doesn't have one
      if (!data.id) {
        data.id = TinyERPHelpers.generateId(entity.charAt(0).toUpperCase());
      }
      
      return data;
    } catch (error) {
      console.error(`Error saving ${entity} data:`, error);
      throw error;
    }
  },

  /**
   * Delete data
   * @param {string} entity - Entity name (e.g., 'customers', 'items')
   * @param {string} id - ID of record to delete
   * @returns {Promise} - Promise resolving to success status
   */
  async deleteData(entity, id) {
    try {
      // In a real application, this would be an API call
      // For this demo, we'll simulate deletion by logging to console
      console.log(`Deleting ${entity} with ID ${id}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting ${entity} data:`, error);
      throw error;
    }
  },

  /**
   * Get entity by ID
   * @param {string} entity - Entity name (e.g., 'customers', 'items')
   * @param {string} id - ID of record to get
   * @returns {Promise} - Promise resolving to entity data
   */
  async getById(entity, id) {
    try {
      const data = await this.loadData(entity);
      return data.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Error getting ${entity} by ID:`, error);
      return null;
    }
  },

  /**
   * Search entities by criteria
   * @param {string} entity - Entity name (e.g., 'customers', 'items')
   * @param {Object} criteria - Search criteria
   * @returns {Promise} - Promise resolving to filtered data array
   */
  async search(entity, criteria) {
    try {
      const data = await this.loadData(entity);
      
      if (!criteria || Object.keys(criteria).length === 0) {
        return data;
      }
      
      return data.filter(item => {
        return Object.entries(criteria).every(([key, value]) => {
          if (typeof value === 'string') {
            return item[key] && item[key].toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        });
      });
    } catch (error) {
      console.error(`Error searching ${entity}:`, error);
      return [];
    }
  }
};

// Make data service available globally
window.DataService = DataService;
