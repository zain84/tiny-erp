// Window Manager for Tiny-ERP
// Handles multiple transaction windows and their lifecycle

const WindowManager = {
  data() {
    return {
      windows: [],
      nextWindowId: 1,
      activeWindowId: null,
      zIndexBase: 1000
    };
  },
  methods: {
    // Create a new window
    createWindow(options) {
      const windowId = this.nextWindowId++;
      
      const defaultOptions = {
        title: 'New Window',
        component: null,
        componentProps: {},
        width: 900,
        height: 600,
        x: 50 + (this.windows.length * 20),
        y: 50 + (this.windows.length * 20),
        minimized: false,
        maximized: false
      };
      
      const windowOptions = { ...defaultOptions, ...options, id: windowId };
      
      // Add window to collection
      this.windows.push(windowOptions);
      
      // Set as active window
      this.setActiveWindow(windowId);
      
      return windowId;
    },
    
    // Close a window
    closeWindow(windowId) {
      const index = this.windows.findIndex(w => w.id === windowId);
      if (index === -1) return;
      
      // Remove window
      this.windows.splice(index, 1);
      
      // If this was the active window, activate the next one
      if (this.activeWindowId === windowId && this.windows.length > 0) {
        this.setActiveWindow(this.windows[this.windows.length - 1].id);
      } else if (this.windows.length === 0) {
        this.activeWindowId = null;
      }
    },
    
    // Set active window
    setActiveWindow(windowId) {
      this.activeWindowId = windowId;
      
      // Reorder windows to bring active to front
      const index = this.windows.findIndex(w => w.id === windowId);
      if (index === -1) return;
      
      // Update z-index for all windows
      this.windows.forEach((window, i) => {
        window.zIndex = this.zIndexBase + i;
      });
      
      // Move active window to highest z-index
      const window = this.windows[index];
      window.zIndex = this.zIndexBase + this.windows.length;
    },
    
    // Minimize window
    minimizeWindow(windowId) {
      const window = this.windows.find(w => w.id === windowId);
      if (!window) return;
      
      window.minimized = true;
      
      // If this was the active window, activate the next one
      if (this.activeWindowId === windowId && this.windows.length > 0) {
        const visibleWindows = this.windows.filter(w => !w.minimized);
        if (visibleWindows.length > 0) {
          this.setActiveWindow(visibleWindows[visibleWindows.length - 1].id);
        }
      }
    },
    
    // Restore window
    restoreWindow(windowId) {
      const window = this.windows.find(w => w.id === windowId);
      if (!window) return;
      
      window.minimized = false;
      window.maximized = false;
      
      // Set as active window
      this.setActiveWindow(windowId);
    },
    
    // Maximize window
    maximizeWindow(windowId) {
      const window = this.windows.find(w => w.id === windowId);
      if (!window) return;
      
      window.maximized = true;
      window.minimized = false;
      
      // Set as active window
      this.setActiveWindow(windowId);
    },
    
    // Start window drag
    startWindowDrag(windowId, event) {
      const window = this.windows.find(w => w.id === windowId);
      if (!window || window.maximized) return;
      
      // Set as active window
      this.setActiveWindow(windowId);
      
      // Store initial position and mouse coordinates
      window.dragStartX = event.clientX;
      window.dragStartY = event.clientY;
      window.dragStartWindowX = window.x;
      window.dragStartWindowY = window.y;
      
      // Add event listeners for drag
      document.addEventListener('mousemove', this.handleWindowDrag);
      document.addEventListener('mouseup', this.stopWindowDrag);
    },
    
    // Handle window drag
    handleWindowDrag(event) {
      const window = this.windows.find(w => w.id === this.activeWindowId);
      if (!window) return;
      
      // Calculate new position
      window.x = window.dragStartWindowX + (event.clientX - window.dragStartX);
      window.y = window.dragStartWindowY + (event.clientY - window.dragStartY);
    },
    
    // Stop window drag
    stopWindowDrag() {
      document.removeEventListener('mousemove', this.handleWindowDrag);
      document.removeEventListener('mouseup', this.stopWindowDrag);
    },
    
    // Start window resize
    startWindowResize(windowId, event) {
      const window = this.windows.find(w => w.id === windowId);
      if (!window || window.maximized) return;
      
      // Set as active window
      this.setActiveWindow(windowId);
      
      // Store initial size and mouse coordinates
      window.resizeStartX = event.clientX;
      window.resizeStartY = event.clientY;
      window.resizeStartWidth = window.width;
      window.resizeStartHeight = window.height;
      
      // Add event listeners for resize
      document.addEventListener('mousemove', this.handleWindowResize);
      document.addEventListener('mouseup', this.stopWindowResize);
    },
    
    // Handle window resize
    handleWindowResize(event) {
      const window = this.windows.find(w => w.id === this.activeWindowId);
      if (!window) return;
      
      // Calculate new size
      const newWidth = window.resizeStartWidth + (event.clientX - window.resizeStartX);
      const newHeight = window.resizeStartHeight + (event.clientY - window.resizeStartY);
      
      // Apply minimum size constraints
      window.width = Math.max(300, newWidth);
      window.height = Math.max(200, newHeight);
    },
    
    // Stop window resize
    stopWindowResize() {
      document.removeEventListener('mousemove', this.handleWindowResize);
      document.removeEventListener('mouseup', this.stopWindowResize);
    }
  }
};

// Register as a global mixin
Vue.mixin(WindowManager);

// Window component
Vue.component('erp-window', {
  props: {
    window: {
      type: Object,
      required: true
    }
  },
  computed: {
    isActive() {
      return this.$root.activeWindowId === this.window.id;
    },
    windowStyle() {
      if (this.window.minimized) {
        return {
          display: 'none'
        };
      }
      
      if (this.window.maximized) {
        return {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          zIndex: this.window.zIndex
        };
      }
      
      return {
        position: 'fixed',
        top: `${this.window.y}px`,
        left: `${this.window.x}px`,
        width: `${this.window.width}px`,
        height: `${this.window.height}px`,
        zIndex: this.window.zIndex
      };
    }
  },
  methods: {
    onHeaderMouseDown(event) {
      // Only handle left mouse button
      if (event.button !== 0) return;
      
      // Don't start drag if clicking on a button
      if (event.target.closest('button')) return;
      
      this.$root.startWindowDrag(this.window.id, event);
    },
    onResizeHandleMouseDown(event) {
      // Only handle left mouse button
      if (event.button !== 0) return;
      
      this.$root.startWindowResize(this.window.id, event);
    },
    onWindowClick() {
      this.$root.setActiveWindow(this.window.id);
    },
    closeWindow() {
      this.$root.closeWindow(this.window.id);
    },
    minimizeWindow() {
      this.$root.minimizeWindow(this.window.id);
    },
    maximizeWindow() {
      this.$root.maximizeWindow(this.window.id);
    },
    restoreWindow() {
      this.$root.restoreWindow(this.window.id);
    }
  },
  template: `
    <div 
      class="erp-window card" 
      :style="windowStyle" 
      :class="{ 'active': isActive }"
      @click="onWindowClick"
    >
      <div 
        class="erp-window-header card-header d-flex justify-content-between align-items-center"
        @mousedown="onHeaderMouseDown"
      >
        <h5 class="mb-0">{{ window.title }}</h5>
        <div class="erp-window-controls">
          <button type="button" class="btn btn-sm btn-light" @click="minimizeWindow">
            <i class="fas fa-window-minimize"></i>
          </button>
          <button 
            v-if="!window.maximized" 
            type="button" 
            class="btn btn-sm btn-light" 
            @click="maximizeWindow"
          >
            <i class="fas fa-window-maximize"></i>
          </button>
          <button 
            v-else 
            type="button" 
            class="btn btn-sm btn-light" 
            @click="restoreWindow"
          >
            <i class="fas fa-window-restore"></i>
          </button>
          <button type="button" class="btn btn-sm btn-danger" @click="closeWindow">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="erp-window-body card-body">
        <component 
          :is="window.component" 
          v-bind="window.componentProps"
          @close="closeWindow"
        ></component>
      </div>
      <div 
        v-if="!window.maximized"
        class="erp-window-resize-handle"
        @mousedown="onResizeHandleMouseDown"
      ></div>
    </div>
  `
});

// Window taskbar component
Vue.component('erp-window-taskbar', {
  computed: {
    windows() {
      return this.$root.windows;
    }
  },
  methods: {
    activateWindow(windowId) {
      const window = this.$root.windows.find(w => w.id === windowId);
      if (!window) return;
      
      if (window.minimized) {
        this.$root.restoreWindow(windowId);
      } else {
        this.$root.setActiveWindow(windowId);
      }
    }
  },
  template: `
    <div class="erp-window-taskbar">
      <div class="btn-group">
        <button 
          v-for="window in windows" 
          :key="window.id"
          type="button" 
          class="btn btn-light" 
          :class="{ 'active': $root.activeWindowId === window.id }"
          @click="activateWindow(window.id)"
        >
          {{ window.title }}
        </button>
      </div>
    </div>
  `
});
