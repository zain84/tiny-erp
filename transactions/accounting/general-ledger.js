// General Ledger Transaction Component for Tiny-ERP
// Standalone transaction screen for general ledger management

Vue.component('general-ledger-transaction', {
  mixins: [Vue.extend(Vue.component('base-transaction'))],
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      entityType: 'generalLedger',
      chartOfAccounts: [],
      accountingPeriods: [],
      loadingMasterData: false,
      validationRules: {
        date: { required: true },
        description: { required: true }
      },
      statusOptions: [
        { value: 'draft', text: 'Draft' },
        { value: 'pending', text: 'Pending Approval' },
        { value: 'posted', text: 'Posted' },
        { value: 'cancelled', text: 'Cancelled' }
      ],
      newEntry: {
        accountCode: '',
        description: '',
        debit: 0,
        credit: 0
      }
    };
  },
  computed: {
    accountOptions() {
      return this.chartOfAccounts
        .filter(account => account.isActive)
        .map(account => ({
          value: account.code,
          text: `${account.code} - ${account.name}`
        }));
    },
    periodOptions() {
      return this.accountingPeriods
        .filter(period => period.status !== 'closed')
        .map(period => ({
          value: period.id,
          text: period.name
        }));
    },
    totalDebit() {
      if (!this.entity.entries) return 0;
      return this.entity.entries.reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);
    },
    totalCredit() {
      if (!this.entity.entries) return 0;
      return this.entity.entries.reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);
    },
    isBalanced() {
      return Math.abs(this.totalDebit - this.totalCredit) < 0.001; // Allow for small rounding errors
    },
    selectedAccount() {
      return this.chartOfAccounts.find(account => account.code === this.newEntry.accountCode);
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
      }
      
      // Validate entries
      if (!this.entity.entries || this.entity.entries.length === 0) {
        this.validationErrors.entries = 'At least one entry is required';
      }
      
      // Validate balance
      if (!this.isBalanced) {
        this.validationErrors.balance = 'Journal entry must be balanced (total debits must equal total credits)';
      }
      
      return Object.keys(this.validationErrors).length === 0;
    },
    
    // Load master data (chart of accounts, accounting periods)
    async loadMasterData() {
      this.loadingMasterData = true;
      
      try {
        // Load accounting data
        const accountingResponse = await fetch('/data/accounting.json');
        if (!accountingResponse.ok) {
          throw new Error('Failed to load accounting data');
        }
        
        const accountingData = await accountingResponse.json();
        this.chartOfAccounts = accountingData.chartOfAccounts || [];
        this.accountingPeriods = accountingData.accountingPeriods || [];
      } catch (error) {
        console.error('Error loading master data:', error);
        this.error = 'Failed to load master data';
      } finally {
        this.loadingMasterData = false;
      }
    },
    
    // Initialize entity
    initializeEntity() {
      if (!this.entity.entries) {
        this.entity.entries = [];
      }
      
      if (!this.entity.date) {
        this.entity.date = new Date().toISOString().split('T')[0];
      }
      
      if (!this.entity.status) {
        this.entity.status = 'draft';
      }
    },
    
    // Add entry to general ledger
    addEntry() {
      if (!this.newEntry.accountCode) {
        return;
      }
      
      // Validate debit and credit
      if ((this.newEntry.debit <= 0 && this.newEntry.credit <= 0) || 
          (this.newEntry.debit > 0 && this.newEntry.credit > 0)) {
        alert('Please enter either a debit amount or a credit amount, but not both.');
        return;
      }
      
      const account = this.chartOfAccounts.find(a => a.code === this.newEntry.accountCode);
      if (!account) return;
      
      // Add new entry
      this.entity.entries.push({
        id: TinyERPHelpers.generateId('GLE'),
        accountCode: account.code,
        accountName: account.name,
        description: this.newEntry.description || this.entity.description,
        debit: parseFloat(this.newEntry.debit) || 0,
        credit: parseFloat(this.newEntry.credit) || 0
      });
      
      // Update totals
      this.updateTotals();
      
      // Reset new entry form
      this.newEntry = {
        accountCode: '',
        description: '',
        debit: 0,
        credit: 0
      };
    },
    
    // Remove entry from general ledger
    removeEntry(index) {
      this.entity.entries.splice(index, 1);
      this.updateTotals();
    },
    
    // Update totals
    updateTotals() {
      this.entity.totalDebit = this.totalDebit;
      this.entity.totalCredit = this.totalCredit;
    },
    
    // Auto-balance entry
    autoBalance() {
      if (this.entity.entries.length < 1) return;
      
      const difference = this.totalDebit - this.totalCredit;
      if (Math.abs(difference) < 0.001) return; // Already balanced
      
      // Ask user which account to use for balancing
      const accountCode = prompt('Enter account code to use for balancing:');
      if (!accountCode) return;
      
      const account = this.chartOfAccounts.find(a => a.code === accountCode);
      if (!account) {
        alert('Invalid account code.');
        return;
      }
      
      // Add balancing entry
      if (difference > 0) {
        // Need more credits
        this.entity.entries.push({
          id: TinyERPHelpers.generateId('GLE'),
          accountCode: account.code,
          accountName: account.name,
          description: 'Balancing entry',
          debit: 0,
          credit: difference
        });
      } else {
        // Need more debits
        this.entity.entries.push({
          id: TinyERPHelpers.generateId('GLE'),
          accountCode: account.code,
          accountName: account.name,
          description: 'Balancing entry',
          debit: Math.abs(difference),
          credit: 0
        });
      }
      
      this.updateTotals();
    },
    
    // Override saveEntity to update totals before saving
    async saveEntity() {
      this.updateTotals();
      return await this.$refs.baseTransaction.saveEntity();
    }
  },
  created() {
    // Load master data
    this.loadMasterData();
    
    // Initialize entity
    this.initializeEntity();
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
              <div class="d-flex justify-content-between">
                <span class="font-weight-bold">{{ entity.reference || entity.id }}</span>
                <span class="badge" :class="'badge-' + TinyERPHelpers.getStatusBadgeClass(entity.status)">
                  {{ entity.status }}
                </span>
              </div>
              <div>{{ entity.description }}</div>
              <div class="small text-muted">
                {{ TinyERPHelpers.formatDate(entity.date) }} | 
                {{ TinyERPHelpers.formatCurrency(entity.totalDebit) }}
              </div>
            </div>
          </a>
        </template>
        
        <template v-slot:form>
          <form-section title="General Ledger Information">
            <form-row>
              <form-col size="6">
                <form-input
                  v-model="entity.reference"
                  label="Reference"
                  :error="validationErrors.reference"
                ></form-input>
              </form-col>
              <form-col size="6">
                <form-select
                  v-model="entity.status"
                  label="Status"
                  :options="statusOptions"
                  :error="validationErrors.status"
                ></form-select>
              </form-col>
            </form-row>
            
            <form-row>
              <form-col size="6">
                <form-date
                  v-model="entity.date"
                  label="Transaction Date"
                  required
                  :error="validationErrors.date"
                ></form-date>
              </form-col>
              <form-col size="6">
                <form-input
                  v-model="entity.description"
                  label="Description"
                  required
                  :error="validationErrors.description"
                ></form-input>
              </form-col>
            </form-row>
          </form-section>
          
          <form-section title="Journal Entries">
            <div v-if="validationErrors.entries" class="alert alert-danger">
              {{ validationErrors.entries }}
            </div>
            
            <div v-if="validationErrors.balance" class="alert alert-danger">
              {{ validationErrors.balance }}
            </div>
            
            <div class="mb-3">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">Add Entry</h6>
                  <div class="form-row">
                    <div class="col-md-4">
                      <form-select
                        v-model="newEntry.accountCode"
                        label="Account"
                        :options="accountOptions"
                        :disabled="loadingMasterData"
                      ></form-select>
                    </div>
                    <div class="col-md-4">
                      <form-input
                        v-model="newEntry.description"
                        label="Description"
                        :placeholder="entity.description"
                      ></form-input>
                    </div>
                    <div class="col-md-2">
                      <form-input
                        v-model.number="newEntry.debit"
                        label="Debit"
                        type="number"
                        min="0"
                        step="0.01"
                      ></form-input>
                    </div>
                    <div class="col-md-2">
                      <form-input
                        v-model.number="newEntry.credit"
                        label="Credit"
                        type="number"
                        min="0"
                        step="0.01"
                      ></form-input>
                    </div>
                  </div>
                  <div class="text-right mt-3">
                    <button type="button" class="btn btn-primary" @click="addEntry">
                      <i class="fas fa-plus"></i> Add Entry
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(entry, index) in entity.entries" :key="entry.id || index">
                    <td>{{ entry.accountCode }} - {{ entry.accountName }}</td>
                    <td>{{ entry.description }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(entry.debit) }}</td>
                    <td class="text-right">{{ TinyERPHelpers.formatCurrency(entry.credit) }}</td>
                    <td>
                      <button type="button" class="btn btn-sm btn-danger" @click="removeEntry(index)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!entity.entries || entity.entries.length === 0">
                    <td colspan="5" class="text-center">No entries added</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" class="text-right font-weight-bold">Totals:</td>
                    <td class="text-right font-weight-bold">{{ TinyERPHelpers.formatCurrency(totalDebit) }}</td>
                    <td class="text-right font-weight-bold">{{ TinyERPHelpers.formatCurrency(totalCredit) }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="2" class="text-right font-weight-bold">Difference:</td>
                    <td colspan="2" class="text-center" :class="{'text-danger': !isBalanced, 'text-success': isBalanced}">
                      {{ isBalanced ? 'Balanced' : TinyERPHelpers.formatCurrency(Math.abs(totalDebit - totalCredit)) }}
                    </td>
                    <td>
                      <button 
                        v-if="!isBalanced" 
                        type="button" 
                        class="btn btn-sm btn-warning"
                        @click="autoBalance"
                      >
                        Auto-Balance
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </form-section>
        </template>
      </base-transaction>
    </div>
  `
});
