import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export default function fixHtmlPlugin() {
  return {
    name: 'fix-electron-paths',
    closeBundle() {
      const indexPath = resolve(__dirname, 'dist/index.html')
      let html = readFileSync(indexPath, 'utf-8')

      html = html.replace(/src="\/js\//g, 'src="./js/')
      html = html.replace(/href="\/js\//g, 'href="./js/')
      html = html.replace(/href="\/css\//g, 'href="./css/')
      html = html.replace(/href="\.\//g, 'href="./')

      writeFileSync(indexPath, html, 'utf-8')
      console.log('[fix-electron-paths] Fixed HTML paths for Electron')
    }
  }
}