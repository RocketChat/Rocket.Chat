/**
 * Reserved discriminator stamped by the `EventResult.*` factories below.
 */
export const EVENT_RESULT_KIND = 'EventResult';

type Marker = { '@kind': typeof EVENT_RESULT_KIND };

export type I18nMessage = {
	key: string;
	args?: { [key: string]: string | number };
};

/** Branded variant returned by `EventResult.pass()`. */
export type PassEventResult = Marker & { type: 'pass' };

/** Branded variant returned by `EventResult.patch()`. */
export type PatchEventResult<T> = Marker & { type: 'patch'; patch: Partial<T> };

/** Branded variant returned by `EventResult.prevent()`. */
export type PreventEventResult = Marker & { type: 'prevent' } & ({ reason: string } | { i18n: I18nMessage });

/**
 * The shape that actually crosses the JSON-RPC boundary and that
 * `isEventResult()` recognizes — `EventResult` widened with the `@kind` marker.
 */
export type MarkedEventResult<T = unknown> = PassEventResult | PatchEventResult<T> | PreventEventResult;

/**
 * Companion-object factories. `EventResult` is simultaneously the marker-free
 * union *type* above and this factory *value* namespace (same name, separate
 * type/value namespaces — no declaration-merging trick needed). Each factory
 * stamps `@kind` and returns a branded per-variant type so that a handler whose
 * return type is a restricted union (e.g. `pass | patch`) fails to typecheck if
 * an author returns a disallowed variant (e.g. `prevent`).
 */
export const EventResult = {
	pass(): PassEventResult {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'pass' };
	},

	patch<T>(patch: Partial<T>): PatchEventResult<T> {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'patch', patch };
	},

	prevent(input: { reason: string } | { i18n: I18nMessage }): PreventEventResult {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'prevent', ...input };
	},
};
