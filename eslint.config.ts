import vueI18n from '@intlify/eslint-plugin-vue-i18n';
import pluginVitest from '@vitest/eslint-plugin';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import skipFormatting from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';
import pluginOxlint from 'eslint-plugin-oxlint';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginVue from 'eslint-plugin-vue';
import { globalIgnores } from 'eslint/config';

const vueI18nBase = vueI18n.configs['flat/base'].filter((config) => !config.files);

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    'playwright-report/**',
    'test-results/**',
    'src/shared/api/generated/**',
    'src/components/ui/**',
  ]),

  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  ...vueI18nBase,
  {
    name: 'app/i18n',
    files: ['src/**/*.vue'],
    settings: {
      'vue-i18n': {
        localeDir: './src/locales/*.json',
        messageSyntaxVersion: '^11.0.0',
      },
    },
    rules: {
      '@intlify/vue-i18n/no-raw-text': 'error',
      '@intlify/vue-i18n/no-missing-keys': 'error',
      '@intlify/vue-i18n/no-v-html': 'error',
      '@intlify/vue-i18n/no-deprecated-tc': 'error',
    },
  },

  {
    name: 'app/boundaries',
    files: ['src/**/*.{vue,ts}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
      'boundaries/include': ['src/**/*'],
      'boundaries/ignore': ['src/main.ts'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'page', pattern: 'src/pages' },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
        { type: 'component', pattern: 'src/components' },
        { type: 'shared', pattern: ['src/shared', 'src/locales', 'src/styles'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { allow: { to: { module: { origin: 'external' } } } },
            { allow: { to: { module: { origin: 'core' } } } },
            { allow: { dependency: { relationship: { to: 'internal' } } } },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['app', 'page', 'feature', 'component', 'shared'] } },
                },
              },
            },
            {
              from: { element: { type: 'page' } },
              allow: { to: { element: { types: { anyOf: ['feature', 'component', 'shared'] } } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { types: { anyOf: ['component', 'shared'] } } } },
            },
            {
              from: { element: { types: { anyOf: ['app', 'page'] } } },
              disallow: { to: { element: { type: 'feature', fileInternalPath: '!index.ts' } } },
            },
            {
              from: { element: { type: 'component' } },
              allow: { to: { element: { types: { anyOf: ['component', 'shared'] } } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
          ],
        },
      ],
    },
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
);
