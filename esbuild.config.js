import { build } from 'esbuild'
import { readFileSync } from 'fs'

// Đọc package.json để lấy thông tin
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: false,
  target: 'es2020',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [], // Không external gì vì đây là library
  platform: 'neutral',
  mainFields: ['module', 'main'],
  conditions: ['import'],
  treeShaking: true,
  // Tối ưu cho kích thước
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  // Giữ tên class và function để dễ debug
  keepNames: false,
  // Tối ưu cho production
  drop: ['console', 'debugger'],
  // Cấu hình metafile để phân tích
  metafile: true
}

// Build function
async function buildLibrary() {
  try {
    console.log('🚀 Building with ESBuild...')
    
    const result = await build(buildOptions)
    
    console.log('✅ Build completed!')
    console.log(`📦 Output: ${buildOptions.outfile}`)
    
    // Hiển thị thông tin bundle
    if (result.metafile) {
      const output = result.metafile.outputs[buildOptions.outfile]
      if (output) {
        console.log(`📏 Bundle size: ${(output.bytes / 1024).toFixed(2)} KB`)
      }
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

// Chạy build nếu file được gọi trực tiếp
if (process.argv[1] && process.argv[1].endsWith('esbuild.config.js')) {
  buildLibrary()
}

export { buildLibrary, buildOptions }
