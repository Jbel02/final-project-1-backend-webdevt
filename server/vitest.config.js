import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    // One in-memory replica set is started per test file (see test/setup.js);
    // the first run downloads the MongoDB binary, which can take a while.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    fileParallelism: false,
  },
})
