// Form Controls Component for Tiny-ERP
// Reusable form input components with validation

// Text Input Component
Vue.component('form-input', {
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    min: {
      type: [Number, String],
      default: null
    },
    max: {
      type: [Number, String],
      default: null
    },
    step: {
      type: [Number, String],
      default: null
    }
  },
  computed: {
    inputClass() {
      return {
        'form-control': true,
        'is-invalid': this.error
      };
    }
  },
  methods: {
    updateValue(event) {
      let value = event.target.value;
      
      // Convert to number for number inputs
      if (this.type === 'number' && value !== '') {
        value = Number(value);
      }
      
      this.$emit('input', value);
    }
  },
  template: `
    <div class="form-group">
      <label :class="{ 'required-field': required }">{{ label }}</label>
      <input
        :type="type"
        :value="value"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :class="inputClass"
        @input="updateValue"
      />
      <div v-if="error" class="invalid-feedback">{{ error }}</div>
    </div>
  `
});

// Textarea Component
Vue.component('form-textarea', {
  props: {
    value: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 3
    }
  },
  computed: {
    inputClass() {
      return {
        'form-control': true,
        'is-invalid': this.error
      };
    }
  },
  template: `
    <div class="form-group">
      <label :class="{ 'required-field': required }">{{ label }}</label>
      <textarea
        :value="value"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :class="inputClass"
        @input="$emit('input', $event.target.value)"
      ></textarea>
      <div v-if="error" class="invalid-feedback">{{ error }}</div>
    </div>
  `
});

// Select Component
Vue.component('form-select', {
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    label: {
      type: String,
      required: true
    },
    options: {
      type: Array,
      required: true
      // Each option should have: { value, text }
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Select an option'
    }
  },
  computed: {
    selectClass() {
      return {
        'form-control': true,
        'is-invalid': this.error
      };
    }
  },
  template: `
    <div class="form-group">
      <label :class="{ 'required-field': required }">{{ label }}</label>
      <select
        :value="value"
        :required="required"
        :disabled="disabled"
        :class="selectClass"
        @change="$emit('input', $event.target.value)"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.text }}
        </option>
      </select>
      <div v-if="error" class="invalid-feedback">{{ error }}</div>
    </div>
  `
});

// Checkbox Component
Vue.component('form-checkbox', {
  props: {
    value: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  template: `
    <div class="form-group form-check">
      <input
        type="checkbox"
        class="form-check-input"
        :checked="value"
        :disabled="disabled"
        @change="$emit('input', $event.target.checked)"
      />
      <label class="form-check-label">{{ label }}</label>
    </div>
  `
});

// Date Picker Component
Vue.component('form-date', {
  props: {
    value: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    min: {
      type: String,
      default: null
    },
    max: {
      type: String,
      default: null
    }
  },
  computed: {
    inputClass() {
      return {
        'form-control': true,
        'is-invalid': this.error
      };
    }
  },
  template: `
    <div class="form-group">
      <label :class="{ 'required-field': required }">{{ label }}</label>
      <input
        type="date"
        :value="value"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :class="inputClass"
        @input="$emit('input', $event.target.value)"
      />
      <div v-if="error" class="invalid-feedback">{{ error }}</div>
    </div>
  `
});

// Form Section Component
Vue.component('form-section', {
  props: {
    title: {
      type: String,
      required: true
    }
  },
  template: `
    <div class="form-section">
      <h5 class="form-section-title">{{ title }}</h5>
      <slot></slot>
    </div>
  `
});

// Form Row Component (for horizontal layout)
Vue.component('form-row', {
  template: `
    <div class="form-row">
      <slot></slot>
    </div>
  `
});

// Form Column Component (for horizontal layout)
Vue.component('form-col', {
  props: {
    size: {
      type: [Number, String],
      default: 12
    }
  },
  computed: {
    colClass() {
      return `col-md-${this.size}`;
    }
  },
  template: `
    <div :class="colClass">
      <slot></slot>
    </div>
  `
});
