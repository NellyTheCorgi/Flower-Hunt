import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
    'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY || ''),
    'process.env.GOOGLE_API': JSON.stringify(process.env.GOOGLE_API || ''),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
