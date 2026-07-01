import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/server.ts'],
    format: ['esm'],
    target: 'es2023',
    outDir: 'dist',
    clean: true,
    splitting: false,
    sourcemap: true,
    dts: false,
    esbuildOptions(options) {
        options.banner = {
            js: `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);`
        }
    }
})