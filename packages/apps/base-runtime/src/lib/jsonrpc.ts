/**
 * The JSON-RPC 2.0 message types are owned by the host package, because both
 * sides of the process boundary must build the exact same shapes. This module
 * only re-exports them under a path the runtime code can import relatively,
 * and keeps the dependency on the host build in a single place.
 */

// oxlint-disable-next-line import/export -- the host build is CommonJS, whose named exports oxlint cannot see
export * from '@rocket.chat/apps/dist/lib/jsonrpc';
export { default } from '@rocket.chat/apps/dist/lib/jsonrpc';
