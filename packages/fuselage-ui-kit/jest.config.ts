import type { Config } from 'jest';

export default {
  preset: 'ts-jest',
  errorOnDeprecated: true,
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: false,
            dynamicImport: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '^react($|/.+)': '<rootDir>/../../node_modules/react$1',
    '^react-dom/client$': '<rootDir>/../../node_modules/react-dom$1',
    '^react-dom($|/.+)': '<rootDir>/../../node_modules/react-dom$1',
    '^react-i18next($|/.+)': '<rootDir>/../../node_modules/react-i18next$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
} satisfies Config;
