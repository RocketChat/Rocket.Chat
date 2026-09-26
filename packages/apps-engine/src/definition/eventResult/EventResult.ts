/**
 * Reserved discriminator stamped by the `EventResult.*` factories below.
 *
 * @internal The host reads this brand; an App never needs it.
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

/**
 * The phantom key's type, so a caller can name it without reaching for the declaration.
 *
 * @internal The host strips this key; an App never names it.
 */
export type PatchPhantomKey = typeof PATCH_PHANTOM_KEY;

/** A message the workspace translates, so the reader sees it in their own language. */
export type I18nMessage = {
	/** The translation key the App ships. */
	key: string;
	/** The values to fill the translation's placeholders with. */
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

/**
 * Whatever a handler returns: let the action through, change it, or block it.
 *
 * Declare the handler's return type as this with the patch type filled in;
 * that is what makes `EventResult.patch` check the properties you pass.
 */
export type MarkedEventResult<T = unknown> = PassEventResult | PatchEventResult<T> | PreventEventResult;

/**
 * Builds what a pre-event handler returns.
 *
 * The engine acts on a result one of these factories built and skips anything
 * else, so a handler returns `EventResult.pass()`, never `{ type: 'pass' }`.
 *
 * The engine runs the subscribed apps one after another. See
 * [ADR 0002](../../../../../docs/adr/0002-unified-event-result-for-pre-events.md)
 * for why the three variants are what they are.
 *
 * @example
 * ```ts
 * public async executePreMediaCallCreated(context: IPreMediaCallCreatedContext): Promise<MediaCallCreateEventResult> {
 * 	if (await this.callerIsBlocked(context)) {
 * 		return EventResult.prevent({ i18n: { key: 'caller_is_blocked' } });
 * 	}
 *
 * 	return EventResult.patch({ features: ['audio'] });
 * }
 * ```
 */
export const EventResult = {
	/**
	 * Let the event continue with no intervention
	 */
	pass(): PassEventResult {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'pass' };
	},

	/**
	 * Changes the properties named in `patch` and lets the action proceed.
	 *
	 * The engine keeps only the properties the event declares as patchable and drops the rest.
	 * Each event specifies its own rules, and some may not allow for patching at all.
	 *
	 * @typeParam T - the event's patchable definition.
	 */
	patch<T>(patch: Partial<NoInfer<T>>): PatchEventResult<T> {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'patch', 'patch': patch as Partial<T> };
	},

	/**
	 * Blocks the action.
	 *
	 * Reason should clarify why the app is preventing it. Prefer using a translation key
	 * so the user sees the translated content. Fallback to a text string otherwise.
	 *
	 * How this message reaches users depends on the host server and what event is being blocked.
	 */
	prevent(reason: PreventReason): PreventEventResult {
		return { '@kind': EVENT_RESULT_KIND, 'type': 'prevent', ...reason };
	},
};
