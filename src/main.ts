import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { installInteractive } from './directives/interactive'
import './styles/main.css'

const app = createApp(App)
installInteractive(app)
app.use(router).mount('#app')
