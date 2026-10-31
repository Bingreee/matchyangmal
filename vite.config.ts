import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true, // 같은 와이파이의 폰에서 접속할 수 있게 네트워크 주소로 열기
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 2000, // Phaser 자체가 커서 경고만 올려 둠
  },
});
