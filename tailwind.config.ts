import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  corePlugins: { preflight: false }, // keep the custom design styles in globals.css intact
  theme: { extend: {} },
  plugins: [],
}
export default config
