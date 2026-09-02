/**
 * Reserved discriminator stamped by the `EventResult.*` factories below.
 */
export const EVENT_RESULT_KIND = 'EventResult';

type Marker = { '@kind': typeof EVENT_RESULT_KIND };

/** Key of the phantom on `PatchEventResult` — see the type for what it is for. */
declare const PATCH_PHANTOM_KEY: '__patchedType';

export type I18nMessage = {
	key: string;
	args?: { [key: string]: string | number };
};

/** Branded variant returned by `EventResult.pass()`. */
export type PassEventResult = Marker & { type: 'pass' };

/**
 * Branded variant returned by `EventResult.patch()`.
 *
 * `__patchedType` is a phantom. Nothing reads it, nothing sets it, and it never
 * crosses the wire. It exists to put `T` in a covariant position, so that
 * `PatchEventResult<unknown>` stops satisfying `PatchEventResult<SomePatch>`.
 * Without it `Partial<unknown>` collapses to `{}`, `{}` satisfies every patch
 * type, and a handler that skipped its event's own factory — and so left `T`
 * unresolved — still passed the `implements` check while patching a property
 * that belongs to another event.
 */
export type PatchEventResult<T> = Marker & { type: 'patch'; patch: Partial<T>; [PATCH_PHANTOM_KEY]?: () => T };

/**
 * The phantom's key, so a host that strips it names it once rather than
 * repeating the literal.
 */
export type PatchPhantomKey = typeof PATCH_PHANTOM_KEY;

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

	/**
	 * `NoInfer` keeps `T` out of the inference candidates the argument produces, so
	 * `T` comes from where the result is going — the handler's declared return type
	 * — and the argument is then checked against that patch type. Without it `T`
	 * widens to whatever the caller wrote and every property is "known", which lets
	 * a misspelled or unpatchable property through.
	 *
	 * The check is the excess-property check, so it catches an object literal
	 * written at the call site, not a pre-built object passed by variable.
	 */
	patch<T>(patch: Partial<NoInfer<T>>): PatchEventResult<T> {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'patch', 'patch': patch as Partial<T> };
	},

	prevent(input: { reason: string } | { i18n: I18nMessage }): PreventEventResult {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'prevent', ...input };
	},
};
