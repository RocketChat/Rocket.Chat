/**
 * Slice-1 minimal payloads. Real entity types re-exported from `@rocket.chat/core-typings`
 * (TENETS §6) are deferred — a self-contained shape keeps the skeleton dependency-free.
 */
export type SlicePreMessage = {
	readonly id: string;
	readonly rid: string;
	readonly text: string;
};

export interface IEventPayloads {
	'message:send:pre': {
		payload: { readonly message: SlicePreMessage };
		patchProjection: { text: string };
	};
	'room:create:pre': {
		payload: { readonly message: SlicePreMessage };
		patchProjection: null;
	};
}

/**
 * Slice-1 event catalogue. The full `entity:verb:timing` union (0003 §6) and per-event payload +
 * filterable projections are deferred to a later decision; slice 1 carries a single event end to
 * end to prove the boundary.
 */
export type EventName = keyof IEventPayloads & {};

export type PayloadOf<E extends EventName> = IEventPayloads[E]['payload'];

/** Writable projection a `patch` may set (0002 §2 / 0003 §3). Slice-1 stub. */
export type PatchOf<E extends EventName> = IEventPayloads[E]['patchProjection'];

/**
 * The verdict a `pre` handler returns. See decision 0003 §2 — decisions are *returned*, never
 * thrown, and are plain serializable data so they survive the host↔worker boundary (0005 §4,
 * invariant #2).
 */

/** A localizable reason surfaced to the end user whose action was vetoed (0003 §2). */
export type PreventReason = { message: string } | { i18n: string; i18nArgs?: Record<string, unknown> };

export type DecisionPatch<E extends EventName> = PatchOf<E> extends null ? never : { readonly kind: 'patch'; readonly patch: PatchOf<E> };
export type DecisionPrevent = { readonly kind: 'prevent'; readonly reason: PreventReason };
export type DecisionContinue = { readonly kind: 'continue' };

export type DecisionFor<E extends EventName> = DecisionPatch<E> | DecisionPrevent | DecisionContinue;

/**
 * What a handler receives as its first argument: the event payload's fields plus the decision
 * verbs (0003 §1–2). The verbs are assembled host-side *inside the worker* and produce plain
 * `Decision` data (0005 §4, invariant #2) — `event` is never destructured.
 */
export type AppEvent<E extends EventName> = PayloadOf<E> & {
	readonly name: E;
	readonly continue: DecisionContinue;
	patch(partial: PatchOf<E>): DecisionPatch<E>;
	prevent(reason: PreventReason): DecisionPrevent;
};

/**
 * The capability locator handed to every handler (0002/0003 §1). Slice-1 stub: empty. The
 * read-only/full split and the repositories land in the "ctx round-trip" iteration (0005 §7).
 */
export type Ctx = Record<string, never>;

export type Handler<E extends EventName> = (event: AppEvent<E>, ctx: Ctx) => DecisionFor<E> | Promise<DecisionFor<E>>;
