import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { vTilt, vMagnetic } from './directives/cursorFx'
import './app.css'

const app = createApp(App)
app.directive('tilt', vTilt)
app.directive('magnetic', vMagnetic)
app.use(createPinia()).use(router).mount('#app')
