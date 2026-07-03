import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // engine/bidders 순수 로직 + 스테이지 데이터 정합성만 테스트한다. UI 테스트는 쓰지 않는다.
    include: ['src/engine/**/*.test.ts', 'src/bidders/**/*.test.ts', 'src/stages/**/*.test.ts'],
    environment: 'node',
  },
});
