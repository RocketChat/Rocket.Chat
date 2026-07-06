import type * as Messenger from '../../../messenger';

/**
 * Transitional parity harness for the accessor-consolidation migration.
 *
 * MOVE accessors (see docs/base-runtime-accessor-consolidation.md) are *live in
 * production today* via the host proxy path, so a subtly wrong port - a dropped
 * default, an off-by-one on a cap, a renamed sort field - is an immediate
 * observable regression. Ordinary ported unit tests only prove the new local
 * class satisfies carried-over assertions; they do not prove it emits the same
 * host-bound traffic the proxy path did.
 *
 * This harness makes the *emitted wire traffic* of a runtime accessor
 * observable and assertable: every `accessor:*` / `bridges:*` request an
 * accessor sends is recorded in order, with its params, so a Phase 1-2 port can
 * be pinned against the exact message sequence documented for its host
 * counterpart.
 *
 * It is throwaway infrastructure: it is removed in the Phase 4 teardown once the
 * host accessor classes (and the `accessor:*` channel) no longer exist.
 */

export type RecordedCall = {
	method: string;
	params: unknown[];
};

/**
 * Canned responses keyed by exact request method string. A value may be a
 * plain value (wrapped as the SuccessObject `result`) or a function of the
 * recorded call (so a response can echo params or vary by input).
 */
export type CannedResponses = Record<string, unknown | ((call: RecordedCall) => unknown)>;

export type RecordingSender = {
	/** Drop-in replacement for `Messenger.sendRequest`. */
	sender: typeof Messenger.sendRequest;
	/** Every request the accessor sent, in order. */
	calls: RecordedCall[];
	/** Convenience: just the ordered `{ method, params }` pairs. */
	emitted(): RecordedCall[];
	/** Convenience: just the ordered method strings. */
	methods(): string[];
};

const makeSuccessObject = (result: unknown) => ({
	id: 'parity-harness',
	jsonrpc: '2.0' as const,
	result,
	serialize() {
		return JSON.stringify(this);
	},
});

/**
 * Build a recording `sendRequest`. Pass `responses` to control what specific
 * methods resolve to (e.g. `doGetById` returning a fixture entity); any method
 * without a canned response resolves to `null`, mirroring how the host serializes
 * a `void`/`undefined` bridge return.
 */
export function createRecordingSender(responses: CannedResponses = {}): RecordingSender {
	const calls: RecordedCall[] = [];

	const sender = ((requestDescriptor: { method: string; params?: unknown }) => {
		const params = Array.isArray(requestDescriptor.params) ? requestDescriptor.params : [];
		const call: RecordedCall = { method: requestDescriptor.method, params };
		calls.push(call);

		const canned = responses[requestDescriptor.method];
		const result = typeof canned === 'function' ? (canned as (c: RecordedCall) => unknown)(call) : (canned ?? null);

		return Promise.resolve(makeSuccessObject(result));
	}) as typeof Messenger.sendRequest;

	return {
		sender,
		calls,
		emitted: () => calls,
		methods: () => calls.map((c) => c.method),
	};
}
