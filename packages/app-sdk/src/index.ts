/**
 * @rocket.chat/app-sdk — PROPOSAL / RFC
 *
 * A Mastra-inspired redesign of the Rocket.Chat Apps Engine *app-facing* API.
 * This package is illustrative: the types compile and the examples type-check,
 * but the runtime that backs `ctx` is intentionally out of scope (it is
 * *derived* from this surface — see PROPOSAL.md).
 *
 * The whole app-authoring surface is a handful of `define*` factories plus a
 * single injected `ctx`, composed by `defineApp` / `createApp`.
 */

export * from './schema';
export * from './models';
export * from './logger';
export * from './manifest';
export * from './context';
export * from './settings';
export * from './store';
export * from './commands';
export * from './jobs';
export * from './endpoints';
export * from './listeners';
export * from './ui';
export * from './providers';
export * from './app';

/**
 * The host data & query layer (PROPOSAL-DATA-LAYER.md). Namespaced, because it
 * supersedes parts of `context.ts` and `models.ts` rather than extending them:
 * `import { data } from '@rocket.chat/app-sdk'`.
 */
export * as data from './data';
