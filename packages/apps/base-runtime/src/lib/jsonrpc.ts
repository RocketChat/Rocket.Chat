/**
 * The JSON-RPC 2.0 message types are owned by the host package, because both
 * sides of the process boundary must build the exact same shapes. This module
 * only re-exports them under a path the runtime code can import relatively,
 * and keeps the dependency on the host build in a single place.
 *
 * See `@rocket.chat/apps/src/lib/jsonrpc` for the documentation.
 */

export * from '@rocket.chat/apps/dist/lib/jsonrpc';
export { default } from '@rocket.chat/apps/dist/lib/jsonrpc';
