/**
 * Event listeners.
 *
 * This is the largest surface-area reduction in the redesign. The legacy engine
 * expresses message handling alone across a matrix of single-method interfaces:
 *
 *   IPreMessageSentPrevent · IPreMessageSentExtend · IPreMessageSentModify · IPostMessageSent
 *   IPreMessageDeletePrevent · IPostMessageDeleted · IPreMessageUpdated{Prevent,Extend,Modify} · …
 *
 * — each listed by name in `implements[]` and dispatched by *string method name*
 * (`executePreMessageSentModify`), with a parallel optional `check…` gate. There
 * is no type-level link between what you put in `implements[]` and the methods
 * you actually wrote.
 *
 * The SDK has ONE primitive — `defineListener({ event, handle })` — and encodes
 * intent in the **return value**, exactly like Mastra processors (`abort()` to
 * block, return a modified value to change, return nothing to observe).
 *
 * The outcome factories live under one namespace, `ctx.event`, and take their
 * names from in-tree ADR 0002 (`docs/adr/0002-unified-event-result-for-pre-events.md`):
 *
 *   - observe: return nothing, or `return ctx.event.pass()` (any event)
 *   - pass:    `return ctx.event.pass()` — allow unchanged, explicitly
 *   - patch:   `return ctx.event.patch({ ...subject })` (modifiable `*.before*` events)
 *   - prevent: `return ctx.event.prevent('reason')` (any `*.before*` event)
 *
 * ADR 0002 also specifies a fourth intent, `prompt`. The SDK does not expose it
 * yet, because it depends on an interactive-UI design that is not settled — see
 * rfc/16-surface-interactive-ui.md.
 *
 * The event name is a string literal, so `ctx.data` is precisely typed, and
 * `ctx.event.patch` / `ctx.event.prevent` only exist on events that support them.
 */

import type { AppContext, AppEnv, BaseEnv } from './context';
import type { IMessage, IRoom, IUpload, IUser, RoomId, UserId } from './models';
import type { IsAny } from './schema';

/** Minimal email shape for the `email.beforeSent` interceptor. */
export interface EmailMessage {
	to: string[];
	from: string;
	subject: string;
	html?: string;
	text?: string;
}

/** The full event catalog. `before*` events run synchronously in the action's path. */
export interface EventPayloads {
	// --- messages ---
	'message.beforeSent': { message: IMessage };
	'message.sent': { message: IMessage };
	'message.beforeUpdated': { message: IMessage; previous: IMessage };
	'message.updated': { message: IMessage; previous: IMessage };
	'message.beforeDeleted': { message: IMessage; deleter: IUser };
	'message.deleted': { message: IMessage; deleter: IUser };
	'message.reacted': { message: IMessage; reaction: string; user: IUser; added: boolean };
	'message.pinned': { message: IMessage; user: IUser; pinned: boolean };
	'message.starred': { message: IMessage; user: IUser; starred: boolean };
	'message.reported': { message: IMessage; description: string; user: IUser };
	// --- rooms ---
	'room.beforeCreated': { room: IRoom };
	'room.created': { room: IRoom };
	'room.beforeDeleted': { room: IRoom };
	'room.deleted': { room: IRoom };
	'room.beforeUserJoined': { room: IRoom; joiningUser: IUser; invitingUser?: IUser };
	'room.userJoined': { room: IRoom; joiningUser: IUser; invitingUser?: IUser };
	'room.beforeUserLeave': { room: IRoom; leavingUser: IUser };
	'room.userLeft': { room: IRoom; leavingUser: IUser };
	// --- users ---
	'user.created': { user: IUser };
	'user.updated': { user: IUser; previous: IUser };
	'user.deleted': { user: IUser };
	'user.loggedIn': { user: IUser };
	'user.loggedOut': { user: IUser };
	'user.statusChanged': { user: IUser; status: NonNullable<IUser['status']> };
	// --- uploads / email ---
	'upload.beforeUploaded': { upload: IUpload; buffer: Uint8Array };
	'email.beforeSent': { email: EmailMessage };
	// --- livechat (representative subset) ---
	'livechat.roomStarted': { room: RoomId };
	'livechat.roomClosed': { room: RoomId; closedBy?: UserId };
	'livechat.agentAssigned': { room: RoomId; agent: UserId };
}

export type EventName = keyof EventPayloads;

/** Events that can veto the pending action. */
export type PreventableEvent = Extract<EventName, `${string}.before${string}`>;

/** Subject each modifiable event lets you replace via `ctx.event.patch(...)`. */
export interface ModifiableSubjects {
	'message.beforeSent': IMessage;
	'message.beforeUpdated': IMessage;
	'room.beforeCreated': IRoom;
	'email.beforeSent': EmailMessage;
}
export type ModifiableEvent = keyof ModifiableSubjects;

/** Opaque outcome; only the `ctx.event.*` factories can produce one. */
declare const OUTCOME: unique symbol;
export type ListenerOutcome = { readonly [OUTCOME]: true };

type PreventMixin<E> = IsAny<E> extends true
	? { prevent(reason?: string): ListenerOutcome }
	: E extends PreventableEvent
		? { prevent(reason?: string): ListenerOutcome }
		: {};
type PatchMixin<E> = IsAny<E> extends true
	? { patch(subject: any): ListenerOutcome }
	: E extends ModifiableEvent
		? { patch(subject: ModifiableSubjects[E]): ListenerOutcome }
		: {};

/**
 * The `event` namespace on a listener context: the event name plus the outcome
 * factories the event allows. `pass` is always there; `patch` and `prevent` are
 * conditional, so a post-event handler that calls one fails to type-check.
 */
export type EventNamespace<E extends EventName> = {
	/** The event this handler runs for. */
	readonly name: IsAny<E> extends true ? EventName : E;
	/** Allow the action unchanged. Equivalent to a bare `return`. */
	pass(): ListenerOutcome;
} & PreventMixin<E> &
	PatchMixin<E>;

export type ListenerContext<Env extends AppEnv, E extends EventName> = AppContext<Env> & {
	readonly event: EventNamespace<E>;
	readonly data: IsAny<E> extends true ? any : EventPayloads[E];
};

/** Declarative pre-filter (evaluated by the runtime, replaces the `check…` gate). */
export interface EventFilter {
	roomTypes?: IRoom['type'][];
	/** Only fire for messages/rooms an app has a stake in, etc. Extensible. */
	[k: string]: unknown;
}

export interface ListenerDef<Env extends AppEnv, E extends EventName> {
	event: E;
	when?: EventFilter;
	handle(ctx: ListenerContext<Env, E>): Promise<ListenerOutcome | void> | ListenerOutcome | void;
}

export const LISTENER = Symbol.for('rc.app-sdk.listener');

export type Listener<Env extends AppEnv = AppEnv, E extends EventName = EventName> = ListenerDef<Env, E> & {
	readonly [LISTENER]: true;
};

export function defineListener<E extends EventName, Env extends AppEnv = BaseEnv>(def: ListenerDef<Env, E>): Listener<Env, E> {
	return { ...def, [LISTENER]: true };
}
