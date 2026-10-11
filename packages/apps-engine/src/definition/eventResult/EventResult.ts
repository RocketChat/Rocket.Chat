/**
 * Reserved discriminator stamped by the `EventResult.*` factories below.
 */
export const EVENT_RESULT_KIND = 'EventResult';

type Marker = { '@kind': typeof EVENT_RESULT_KIND };

/**
 * Two mechanisms stop a handler from patching a property that belongs to
 * another event.
 *
 * `NoInfer` in EventResult.patch() keeps `T` out of the inference candidates the
 * argument produces, so `T` comes from where the result is going — the handler's
 * declared return type — and the argument is then checked against that
 * patch type. Without it, `T` widens to whatever the caller wrote and
 * every property is "known", which lets a misspelled or unpatchable
 * property through. This check is the excess-property check, so it
 * catches an object literal written at the call site, not a pre-built
 * object passed by variable.
 *
 * The `PATCH_PHANTOM_KEY` field on `PatchEventResult` covers the other
 * case: a handler that skips this factory and returns a raw object
 * literal instead. Without the phantom field, TypeScript checks only
 * `Partial<T>` there. If `T` stays unresolved as `unknown` in that case,
 * `Partial<unknown>` collapses to `{}`, and since `{}` matches every
 * patch type, TypeScript would let the handler through anyway.
 */

/** Key of the phantom on `PatchEventResult` — see the type for what it is for. */
declare const PATCH_PHANTOM_KEY: '__patchedType';

export type PatchPhantomKey = typeof PATCH_PHANTOM_KEY;

export type I18nMessage = {
	key: string;
	args?: { [key: string]: string | number };
};

/** Branded variant returned by `EventResult.pass()`. */
export type PassEventResult = Marker & { type: 'pass' };

/** Branded variant returned by `EventResult.patch()`. */
export type PatchEventResult<T> = Marker & { type: 'patch'; patch: Partial<T>; [PATCH_PHANTOM_KEY]?: () => T };

/**
 * What a `prevent` says about the block: a sentence the app wrote, or a key the app ships a
 * translation for
 */
export type PreventReason = { reason: string; i18n?: never } | { i18n: I18nMessage; reason?: never };

/** Branded variant returned by `EventResult.prevent()`. */
export type PreventEventResult = Marker & { type: 'prevent' } & PreventReason;

export type MarkedEventResult<T = unknown> = PassEventResult | PatchEventResult<T> | PreventEventResult;

/**
 * Factory that builds the branded objects for event results
 */
export const EventResult = {
	pass(): PassEventResult {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'pass' };
	},

	patch<T>(patch: Partial<NoInfer<T>>): PatchEventResult<T> {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'patch', 'patch': patch as Partial<T> };
	},

	prevent(input: PreventReason): PreventEventResult {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'prevent', ...input };
	},
};
