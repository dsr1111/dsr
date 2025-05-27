import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html',
        calculator: './calculator.html',
        deck: './deck.html',
        detail: './detail.html',
        detector: './detector.html',
        digimon: './digimon.html',
        evolution: './evolution.html',
        exp: './exp.html',
        map: './map.html',
        overflow: './overflow.html'
      }
    }
  }
}) 