/**
 * Opt-in typings for experimental REST endpoints (`/api/experimental/...`).
 *
 * These are intentionally **not** merged into the `Endpoints` union exported
 * from the package root, so the stable typed client surface (`PathPattern`,
 * `Method`, `Path`, the SDK) stays free of unstable paths. Consumers who want
 * typed experimental calls import `ExperimentalEndpoints` explicitly.
 *
 * Endpoints under this namespace carry **no semver promise**: they may change
 * shape or be removed in any release without a deprecation cycle. See
 * `docs/experimental-api-endpoints.md`.
 *
 * Declare new experimental endpoints here, following the per-resource style of
 * the `/v1` endpoint types (e.g. `v1/calendar`). Every path key must begin with
 * `/experimental/`. For example:
 *
 * ```ts
 * export type ExperimentalEndpoints = {
 * 	'/experimental/example.info': {
 * 		GET: (params: { id: string }) => { id: string; value: number };
 * 	};
 * };
 * ```
 */
export type ExperimentalEndpoints = {
	'/experimental/rooms.setCategory': {
		POST: (params: { roomIds: string[]; category: string | null }) => { success: true };
	};
};
