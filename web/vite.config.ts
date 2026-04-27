import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting keeps each chunk small — avoids OOM in rolldown
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
})
