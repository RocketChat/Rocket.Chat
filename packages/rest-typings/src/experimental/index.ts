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
 * This interface is empty on purpose: each endpoint file augments it with the
 * routes it registers, extracted from the actual definition. For example:
 *
 * ```ts
 * const example = API.experimental.get('example.info', { ... }, action);
 *
 * type ExampleEndpoints = ExtractRoutesFromAPI<typeof example>;
 *
 * declare module '@rocket.chat/rest-typings' {
 * 	// eslint-disable-next-line @typescript-eslint/naming-convention
 * 	interface ExperimentalEndpoints extends ExampleEndpoints {}
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface, @typescript-eslint/naming-convention
export interface ExperimentalEndpoints {}
