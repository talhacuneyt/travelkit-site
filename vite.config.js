import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 5173,
      strictPort: true,
      historyApiFallback: true
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001'),
      'import.meta.env.VITE_JWT_SECRET': JSON.stringify(env.VITE_JWT_SECRET || 'fallback-secret-key'),
      'import.meta.env.VITE_EMAILJS_PUBLIC_KEY': JSON.stringify(env.VITE_EMAILJS_PUBLIC_KEY || 'YHkV0_Y_204JXzOSm'),
      'import.meta.env.VITE_EMAILJS_SERVICE_ID': JSON.stringify(env.VITE_EMAILJS_SERVICE_ID || 'service_gkqoexj'),
      'import.meta.env.VITE_EMAILJS_TEMPLATE_ID': JSON.stringify(env.VITE_EMAILJS_TEMPLATE_ID || 'template_97boikk'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://kegdhelzdksivfekktkx.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZ2RoZWx6ZGtzaXZmZWtrdGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTA1NDgsImV4cCI6MjA3MjgyNjU0OH0.9srURxR_AsLu5lqwodeFuV-zsmkkr82PRh9RSToqQUU'),
    }
  }
})
