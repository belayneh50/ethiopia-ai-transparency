import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
const root = fileURLToPath(new URL('.', import.meta.url));
const proxy = { '/api': { target: 'http://localhost:3001', changeOrigin: true, rewrite: (value: string) => value.replace(/^\/api/, '/api/v1') } };
const sharedTypes = path.resolve(root, '../../packages/shared-types');
// Subpaths first (longest-prefix), then the bare specifier. The browser must get
// ESM TypeScript source; the CJS dist/ build is for the Node-side API only.
const alias = {
  '@': path.resolve(root, './src'),
  '@ethiopia-ai/shared-types/transparency': path.join(sharedTypes, 'transparency.ts'),
  '@ethiopia-ai/shared-types/guidance': path.join(sharedTypes, 'guidance.ts'),
  '@ethiopia-ai/shared-types/guidance-adapter': path.join(sharedTypes, 'guidance-adapter.ts'),
  '@ethiopia-ai/shared-types/gemini-model': path.join(sharedTypes, 'gemini-model.ts'),
  '@ethiopia-ai/shared-types': path.join(sharedTypes, 'index.ts'),
};
export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  server: { port: 5173, proxy }, preview: { proxy },
  build: { outDir: 'dist', emptyOutDir: true },
});
