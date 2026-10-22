import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: process.env.OPENAPI_INPUT ?? 'http://localhost:3000/docs-json',
  output: 'src/shared/api/generated',
  plugins: [
    { name: '@hey-api/typescript', enums: 'javascript' },
    { name: '@hey-api/client-fetch', runtimeConfigPath: '@/shared/api/client-config' },
    '@tanstack/vue-query',
  ],
});
