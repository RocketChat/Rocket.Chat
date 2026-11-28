/**
 * Type-level tests for `HostEventResult`.
 *
 * Nothing here runs. `yarn typecheck` compiles this file. It fixes what a host
 * reads off an outcome, which is narrower than what an app returned: the
 * `@kind` marker and the patch phantom are both app-side devices and neither
 * crosses the wire.
 */

import type { PreMediaCallCreatedOutcome } from '../../src/server/mediaCalls/IMediaCallEvent';

type Assert<T extends true> = T;
type Equals<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

type PatchOutcome = Extract<PreMediaCallCreatedOutcome, { type: 'patch' }>;
type PreventOutcome = Extract<PreMediaCallCreatedOutcome, { type: 'prevent' }>;

/**
 * A patch outcome carries the patch and nothing else. `@kind` is stripped
 * because the marker only exists to recognize the value over JSON-RPC, and
 * `__patchedType` is stripped because it only exists to typecheck the app
 * author's `patch` call.
 */
export type APatchOutcomeCarriesOnlyThePatch = Assert<Equals<keyof PatchOutcome, 'type' | 'patch'>>;

/** The engine stamps the acting app onto a prevention, because the host cannot. */
export type APreventionNamesTheApp = Assert<Equals<Extract<keyof PreventOutcome, 'meta'>, 'meta'>>;
