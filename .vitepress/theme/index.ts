// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import Theme from 'vitepress/theme'
import './style.css'
import "./custom.css"
import Layout from './Layout.vue'

export default {
  ...Theme,
  Layout
}
