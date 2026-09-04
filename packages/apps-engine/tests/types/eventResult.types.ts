/**
 * Type-level tests for `EventResult`.
 *
 * Nothing here runs. `yarn typecheck` compiles this file, and every
 * `@ts-expect-error` below fails the build if the line under it ever starts to
 * compile again. Each negative test sits beside a positive control, so a test
 * cannot pass because of some unrelated mistake in the same line.
 */

import { EventResult } from '../../src/definition/eventResult';
import type { PassEventResult, PatchEventResult } from '../../src/definition/eventResult';
import type {
	IMediaCallHandler,
	IPreMediaCallCreatedContext,
	MediaCallCreateEventResult,
	MediaCallCreatePatch,
} from '../../src/definition/mediaCalls';
import { AppMethod } from '../../src/definition/metadata';

type Assert<T extends true> = T;
type Equals<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;
/** Wrapped in tuples so a union on either side is compared whole, not member by member. */
type AssignableTo<A, B> = [A] extends [B] ? true : false;
type Not<T extends boolean> = T extends true ? false : true;

/* ------------------------------------------------------------------ *
 * The type identities the design rests on
 * ------------------------------------------------------------------ */

/**
 * `keyof unknown` is `never`, so a mapped type over it produces the empty object
 * type. This is why an unresolved `T` used to pass for a real patch type.
 */
export type PartialOfUnknownIsTheEmptyType = Assert<Equals<Partial<unknown>, {}>>;

/** Every property of a patch type is optional, so the empty type satisfies all of them. */
export type TheEmptyTypeSatisfiesAnyPatch = Assert<AssignableTo<{}, Partial<MediaCallCreatePatch>>>;

/** The phantom closes exactly that gap: an unresolved `T` no longer passes for a real one. */
export type AnUnresolvedPatchIsRejected = Assert<Not<AssignableTo<PatchEventResult<unknown>, PatchEventResult<MediaCallCreatePatch>>>>;

/**
 * The phantom only works in a covariant position. A parameter is compared the
 * other way round, and everything is assignable to `unknown`, so this shape
 * would accept the very bug the phantom exists to reject.
 */
type WithContravariantMarker<T> = { patch: Partial<T>; marker?: (value: T) => void };
export type AContravariantMarkerWouldNotWork = Assert<
	AssignableTo<WithContravariantMarker<unknown>, WithContravariantMarker<MediaCallCreatePatch>>
>;

/* ------------------------------------------------------------------ *
 * A declared return type gets the patch checked, property by property
 * ------------------------------------------------------------------ */

export const patchesTheRequestedFeatures = (context: IPreMediaCallCreatedContext): MediaCallCreateEventResult =>
	EventResult.patch({ features: context.features.filter((feature) => feature !== 'screen-share') });

export const rejectsAnUnpatchableProperty = (context: IPreMediaCallCreatedContext): MediaCallCreateEventResult =>
	EventResult.patch({
		features: context.features,
		// @ts-expect-error routing settles the contacts before this event runs, so an app cannot patch them
		callee: { type: 'user', id: 'someone-else' },
	});

export const rejectsAPropertyOfAnotherEvent = (): MediaCallCreateEventResult =>
	EventResult.patch({
		// @ts-expect-error `text` belongs to the message events, not to this one
		text: 'redacted',
	});

export const rejectsAWrongValueType = (): MediaCallCreateEventResult =>
	EventResult.patch({
		// @ts-expect-error `features` is a list
		features: 'audio',
	});

/* ------------------------------------------------------------------ *
 * The other two variants
 * ------------------------------------------------------------------ */

export const passes = (): MediaCallCreateEventResult => EventResult.pass();

export const preventsWithAReason = (): MediaCallCreateEventResult => EventResult.prevent({ reason: 'blocked by the test' });

export const preventsWithAKeyTheAppShips = (): MediaCallCreateEventResult => EventResult.prevent({ i18n: { key: 'callee_is_dnd' } });

export const rejectsAPreventionThatSaysNothing = (): MediaCallCreateEventResult =>
	// @ts-expect-error a prevention carries a reason or an i18n key
	EventResult.prevent({});

/**
 * An event that permits only some variants rejects the rest at the `return` —
 * the per-event capability matrix in the ADR.
 */
type PassOrPatchOnly = PassEventResult | PatchEventResult<MediaCallCreatePatch>;
export const rejectsADisallowedVariant = (): PassOrPatchOnly =>
	// @ts-expect-error this event does not permit a prevention
	EventResult.prevent({ reason: 'blocked by the test' });

/* ------------------------------------------------------------------ *
 * What the `implements` clause does and does not do
 * ------------------------------------------------------------------ */

export class AnnotatedHandler implements IMediaCallHandler {
	public async [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED](context: IPreMediaCallCreatedContext): Promise<MediaCallCreateEventResult> {
		return EventResult.patch({ features: context.features });
	}
}

/**
 * An `implements` clause does not contextually type a method body, so without a
 * declared return type `T` never resolves. The phantom turns that into an error
 * here, whatever the patch itself says — the payload below is perfectly valid.
 * The remedy is the annotation on `AnnotatedHandler` above.
 */
export class UnannotatedHandler implements IMediaCallHandler {
	// @ts-expect-error the handler has to declare `Promise<MediaCallCreateEventResult>`
	public async [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED](context: IPreMediaCallCreatedContext) {
		return EventResult.patch({ features: context.features });
	}
}

/** `pass` carries no patch type, so it resolves nothing and needs no annotation. */
export class UnannotatedPassingHandler implements IMediaCallHandler {
	public async [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]() {
		return EventResult.pass();
	}
}
