/**
 * The version of the Apps-Engine package.
 * Consumed by host-side code (e.g. AppPackageParser) to validate app compatibility
 * without relying on filesystem path traversal.
 *
 * Uses require() instead of a static import so TypeScript does not resolve the path
 * at compile time. The compiled output lands at definition/version.js, so
 * '../package.json' correctly points to the package root at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const ENGINE_VERSION: string = (require('../package.json') as { version: string }).version;
