/**
 * The version of the Apps-Engine package.
 * Consumed by host-side code (e.g. AppPackageParser) to validate app compatibility
 * without relying on filesystem path traversal.
 *
 * Uses require() instead of a static import so TypeScript does not resolve the path
 * at compile time.
 *
 * When running for tests, using ts-node, package.json is located two levels above the current file.
 * When running in production, package.json is located one level above the compiled version of this file.
 */
const runningFromSource = __dirname.endsWith('src/definition');
const requirePath = runningFromSource ? '../../package.json' : '../package.json';

// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports -- Paths are bounded, we just need to decide which package.json file to target
export const ENGINE_VERSION: string = require(requirePath).version;
