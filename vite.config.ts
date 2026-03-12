import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pages from '@hono/vite-cloudflare-pages';

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    // 클라이언트(프론트엔드) 빌드
    return {
      plugins: [react()],
      build: {
        outDir: 'dist',
        emptyOutDir: false, // 서버 빌드 결과를 유지
        rollupOptions: {
          input: './index.html',
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]'
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
  }

  // 서버(Hono) 빌드 - 기본 모드
  return {
    plugins: [pages()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
