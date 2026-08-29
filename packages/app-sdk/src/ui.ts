/**
 * Interactive surfaces: modals and contextual bars.
 *
 * Legacy interaction handling is the sharpest edge in the whole engine. You
 * `openModalView(view, context, user)` in one method, then correlate the
 * eventual result in *separate* handler methods keyed by string action/view ids:
 *
 * ```ts
 * // legacy — three disconnected callbacks + manual id bookkeeping
 * async executeBlockActionHandler(context, ...)  { ...stash state in persistence... }
 * async executeViewSubmitHandler(context, ...)   { ...re-read state, match viewId... }
 * async executeViewClosedHandler(context, ...)   { ...clean up... }
 * ```
 *
 * The SDK models a surface interaction as an **awaited call**, built on the
 * runtime's durable suspend/resume (Mastra's `suspend()` / `resumeData`). The
 * `await ctx.ui.open(...)` that shows the modal is the same `await` that
 * resolves when the user submits — even though submission arrives as a wholly
 * separate HTTP interaction handled (perhaps) in a different process. The
 * runtime persists the suspended continuation keyed by the view/trigger id and
 * resumes it on submit. The submitted values are validated against the surface's
 * `state` schema, so `result.values` is fully typed.
 *
 * Block *authoring* (the `render` output) is intentionally left to
 * `@rocket.chat/ui-kit`; the tiny `blocks` helper below exists only so the
 * examples in this proposal render something concrete and type-check offline.
 * See rfc/51-open-questions.md.
 */

import type { AppContext, AppEnv, BaseEnv } from './context';
import type { UiBlock, UserId } from './models';
import type { Infer, Schema } from './schema';

export interface OpenSurface<TState = unknown> {
	readonly kind: 'modal' | 'contextualBar';
	readonly id?: string;
	readonly title: string;
	/** Schema the submitted form is validated against; also types `result.values`. */
	readonly state?: Schema<TState>;
	readonly render: (rc: SurfaceRenderContext<TState>) => readonly UiBlock[] | Promise<readonly UiBlock[]>;
	readonly submit?: { i18nLabel: string };
	readonly close?: { i18nLabel: string };
}

export interface SurfaceRenderContext<TState> {
	/** Prior values (e.g. when re-opening to show a validation error). */
	readonly values?: Partial<TState>;
	/** Block authoring helpers (delegated to `@rocket.chat/ui-kit` in production). */
	readonly blocks: BlockKit;
}

/** The awaited outcome of `ctx.ui.open(...)`, discriminated on `submitted`. */
export type SurfaceResult<S> = S extends OpenSurface<infer TState>
	? { submitted: true; values: TState } | { submitted: false; closed: true }
	: never;

// The factory infers the *schema type* `S` (from a required `state` prop) and
// derives the state via `Infer<S>`. Inferring the state type directly from a
// `Schema<TState>` param can fold in `undefined` from the validator's failure
// branch; inferring `S` then applying `Infer` (which reads the phantom output)
// stays clean. A display-only surface passes an empty schema (`z.object({})`).
type SurfaceDef<S extends Schema> = Omit<OpenSurface<Infer<S>>, 'kind' | 'state'> & { state: S };

/** Define a modal surface. Identity factory (mirrors Mastra's `defineSchedule`). */
export function defineModal<S extends Schema>(surface: SurfaceDef<S>): OpenSurface<Infer<S>> {
	// `S` is provably a schema whose output is `Infer<S>`, but TS cannot see that
	// `S` equals `Schema<Infer<S>>`, so the identity construction needs a cast.
	return { ...surface, kind: 'modal' } as OpenSurface<Infer<S>>;
}

/** Define a contextual-bar surface. */
export function defineContextualBar<S extends Schema>(surface: SurfaceDef<S>): OpenSurface<Infer<S>> {
	return { ...surface, kind: 'contextualBar' } as OpenSurface<Infer<S>>;
}

/** Helper to type-narrow the state of a surface elsewhere. */
export type SurfaceState<S> = S extends OpenSurface<infer T> ? T : never;
export type { Infer as InferSurfaceState };

/* ------------------------------------------------------------------ *
 * Action buttons — declarative UI contribution points.
 * Legacy: IUIExtend.registerButton(descriptor). Kept declarative, but the
 * button's `onClick` is co-located with its descriptor instead of being routed
 * to a far-away executeActionButtonHandler keyed by actionId.
 * ------------------------------------------------------------------ */

export type ActionButtonSurface =
	| 'message'
	| 'messageBox'
	| 'roomToolbar'
	| 'roomSidebar'
	| 'userDropdown';

export interface ActionButton<Env extends AppEnv = BaseEnv> {
	readonly actionId: string;
	readonly i18nLabel: string;
	readonly surface: ActionButtonSurface;
	readonly variant?: 'default' | 'danger';
	/** Visibility filter, evaluated by the runtime (roles/permissions/room types). */
	readonly when?: {
		roomTypes?: string[];
		hasOnePermission?: string[];
		hasAllPermissions?: string[];
	};
	/** Co-located click handler. `ctx` is the trigger context for the click. */
	readonly onClick: (ctx: ActionButtonClickContext<Env>) => Promise<void>;
}

/**
 * The click context is a full `AppContext` (all platform clients) plus the
 * trigger fields. Unlike legacy, where a button click lands in a distant
 * `executeActionButtonHandler` keyed by `actionId`, the handler is co-located
 * with the button descriptor and typically opens a surface via `ctx.ui.open`.
 */
export type ActionButtonClickContext<Env extends AppEnv> = AppContext<Env> & {
	readonly actionId: string;
	readonly triggerId: string;
	readonly user: { id: UserId };
	readonly room?: { id: string };
	readonly message?: { id: string };
};

/* ------------------------------------------------------------------ *
 * Minimal block helper — ONLY for offline-compilable examples.
 * Real apps import authoring helpers from `@rocket.chat/ui-kit`.
 * ------------------------------------------------------------------ */

export interface BlockKit {
	section(text: string): UiBlock;
	divider(): UiBlock;
	input(opts: { label: string; element: UiBlock }): UiBlock;
	textInput(opts: { key: string; placeholder?: string; multiline?: boolean; initialValue?: string }): UiBlock;
	toggle(opts: { key: string; label: string; initialValue?: boolean }): UiBlock;
	actions(elements: UiBlock[]): UiBlock;
	button(opts: { actionId: string; text: string; value?: string; style?: 'primary' | 'danger' }): UiBlock;
}
