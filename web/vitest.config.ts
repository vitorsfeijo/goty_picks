import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['src/hooks/useBallot.ts', 'src/utils/communityStats.ts', 'src/components/CategoryCard.tsx', 'src/components/NomineeItem.tsx'] },
  },
});
