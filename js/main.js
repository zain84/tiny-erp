// Update main.js to integrate window manager and transaction launcher

// Initialize Vue app with window manager support
const app = new Vue({
  el: '#app',
  data: {
    appName: 'Tiny-ERP',
    appVersion: '1.0.0',
    user: {
      name: 'Demo User',
      role: 'Administrator'
    },
    // Window manager data (initialized in the mixin)
    windows: [],
    nextWindowId: 1,
    activeWindowId: null,
    zIndexBase: 1000
  },
  computed: {
    hasOpenWindows() {
      return this.windows.length > 0;
    }
  },
  methods: {
    // Open dashboard as default view
    openDashboard() {
      this.createWindow({
        title: 'Dashboard',
        component: 'dashboard-component',
        componentProps: {}
      });
    }
  },
  mounted() {
    // Open dashboard on startup
    this.openDashboard();
  }
});
