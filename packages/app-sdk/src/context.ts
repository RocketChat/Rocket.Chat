/**
 * The injected execution context (`ctx`).
 *
 * This is the single most important departure from the legacy engine. Today a
 * handler is called with a fixed, positional accessor tuple:
 *
 * ```ts
 * // legacy
 * executePostMessageSent(message, read, http, persistence, modify) {
 *   const room = await read.getRoomReader().getById(message.room.id);
 *   const builder = modify.getCreator().startMessage().setRoom(room).setText('hi');
 *   await modify.getCreator().finish(builder);
 * }
 * ```
 *
 * In the new SDK every executable (command, job, endpoint, listener, lifecycle
 * hook) receives exactly **one** argument: a `ctx` object carrying capability
 * clients. This mirrors Mastra, where a tool/step `execute` receives one params
 * object (`{ mastra, requestContext, inputData, ... }`) rather than positional
 * accessors.
 *
 * ```ts
 * // new
 * async handle(ctx) {
 *   await ctx.messages.send({ room: ctx.data.message.roomId, text: 'hi' });
 * }
 * ```
 *
 * Why it matters beyond ergonomics: because the platform is reached *only*
 * through `ctx` (never through module-level imports of server internals), the
 * runtime is free to hand the app a **local** `ctx` or a **remote (NATS-RPC)**
 * `ctx` with identical app code. That is the property that makes the
 * apps-runtime-as-a-microservice split (see rfc/41-platform-deployment-and-isolation.md) a
 * packaging decision rather than an app-code rewrite.
 */

import type { Logger } from './logger';
import type { IMessage, IRoom, IUpload, IUser, MessageId, RoomId, UploadId, UserId, UiBlock } from './models';
import type { InferArg, Schema } from './schema';
import type { OpenSurface, SurfaceResult } from './ui';

/** Shape of an app's typed environment: its settings value-map and its store collections. */
export interface AppEnv {
	settings: Record<string, unknown>;
	store: Record<string, object>;
}

/** Default environment for env-agnostic definitions (no typed settings/store). */
export interface BaseEnv extends AppEnv {
	settings: Record<string, never>;
	store: Record<string, never>;
}

/** Identity of the running app. */
export interface AppIdentity {
	readonly id: string;
	readonly version: string;
	/** The app's own bot user, used as the default author of created content. */
	readonly appUser: IUser;
}

/* ------------------------------------------------------------------ *
 * Read + write, unified per domain.
 *
 * Legacy split every domain across `IRead.getXReader()` (read) and
 * `IModify.getCreator()/getUpdater()/getDeleter()` (write), the latter via
 * start/…/finish builders. The SDK collapses each domain into one client with
 * plain-object mutations. Builders are gone: you pass the data, the runtime
 * validates and persists it.
 * ------------------------------------------------------------------ */

export interface MessagesClient {
	get(id: MessageId): Promise<IMessage | undefined>;
	/** Create and send a message authored by the app user (or `asUser`). */
	send(input: SendMessageInput): Promise<MessageId>;
	update(id: MessageId, patch: Partial<SendMessageInput>): Promise<void>;
	delete(id: MessageId, opts?: { asUser?: UserId }): Promise<void>;
	addReaction(id: MessageId, emoji: string): Promise<void>;
	removeReaction(id: MessageId, emoji: string): Promise<void>;
}

export interface SendMessageInput {
	room: RoomId;
	text?: string;
	threadId?: MessageId;
	/** Author the message as a specific user instead of the app bot (permission-gated). */
	asUser?: UserId;
	alias?: string;
	avatarUrl?: string;
	attachments?: IMessage['attachments'];
	blocks?: readonly UiBlock[];
	/** Delivered to a single user's client without persisting (ephemeral). */
	ephemeralTo?: UserId;
	groupable?: boolean;
	parseUrls?: boolean;
}

export interface RoomsClient {
	get(id: RoomId): Promise<IRoom | undefined>;
	getByName(name: string): Promise<IRoom | undefined>;
	getDirect(usernames: string[]): Promise<IRoom | undefined>;
	create(input: CreateRoomInput): Promise<RoomId>;
	update(id: RoomId, patch: Partial<CreateRoomInput>): Promise<void>;
	delete(id: RoomId): Promise<void>;
	members(id: RoomId, opts?: PageOpts): Promise<IUser[]>;
	addMembers(id: RoomId, usernames: string[]): Promise<void>;
	removeMembers(id: RoomId, usernames: string[]): Promise<void>;
	/** Iterate a room's messages (async pages), replacing `getMessages(roomId, opts)`. */
	messages(id: RoomId, opts?: PageOpts & { sort?: 'asc' | 'desc' }): AsyncIterable<IMessage>;
}

export interface CreateRoomInput {
	type: IRoom['type'];
	name?: string;
	displayName?: string;
	members?: string[];
	creator?: UserId;
	readOnly?: boolean;
	customFields?: Record<string, unknown>;
}

export interface UsersClient {
	get(id: UserId): Promise<IUser | undefined>;
	getByUsername(username: string): Promise<IUser | undefined>;
	/** The app's own bot user. */
	appUser(): Promise<IUser>;
	/** Narrow, deliberately-limited mutations (mirrors legacy IUserUpdater). */
	updateStatus(id: UserId, status: NonNullable<IUser['status']>, text?: string): Promise<void>;
	deactivate(id: UserId): Promise<void>;
}

export interface UploadsClient {
	get(id: UploadId): Promise<IUpload | undefined>;
	getBuffer(id: UploadId): Promise<Uint8Array>;
	/** Upload a file into a room (replaces getUploadCreator().uploadBuffer()). */
	create(input: { room: RoomId; filename: string; buffer: Uint8Array; asUser?: UserId }): Promise<UploadId>;
}

export interface ThreadsClient {
	get(threadId: MessageId): Promise<IMessage[]>;
}

export interface RolesClient {
	get(idOrName: string): Promise<{ id: string; name: string; scope: string } | undefined>;
}

export interface ContactsClient {
	get(id: string): Promise<{ id: string; name?: string; emails: string[] } | undefined>;
}

/** Livechat, video-conf, moderation and oauth-apps are present for coverage; trimmed here. */
export interface LivechatClient {
	createRoom(input: { visitorToken: string; agentId?: UserId }): Promise<RoomId>;
	closeRoom(room: RoomId, comment: string): Promise<void>;
	transfer(room: RoomId, to: { agentId?: UserId; departmentId?: string }): Promise<void>;
}
export interface VideoConfClient {
	get(callId: string): Promise<{ id: string; url?: string; status: string } | undefined>;
}
export interface ModerationClient {
	report(message: MessageId, description: string, byUser: UserId): Promise<void>;
}
export interface OAuthAppsClient {
	get(idOrName: string): Promise<{ id: string; name: string; clientId: string } | undefined>;
}

/* ------------------------------------------------------------------ *
 * Cross-cutting clients.
 * ------------------------------------------------------------------ */

/** Outbound HTTP. Replaces `IHttp`; SSRF protection and defaults are runtime concerns. */
export interface HttpClient {
	get(url: string, opts?: HttpOpts): Promise<HttpResponse>;
	post(url: string, opts?: HttpOpts): Promise<HttpResponse>;
	put(url: string, opts?: HttpOpts): Promise<HttpResponse>;
	patch(url: string, opts?: HttpOpts): Promise<HttpResponse>;
	del(url: string, opts?: HttpOpts): Promise<HttpResponse>;
}
export interface HttpOpts {
	headers?: Record<string, string>;
	params?: Record<string, string>;
	/** Parsed JSON body to send. */
	json?: unknown;
	body?: string | Uint8Array;
	timeout?: number;
}
export interface HttpResponse {
	statusCode: number;
	headers: Record<string, string>;
	data: unknown;
	text: string;
}

/** In-room presence and out-of-band user notifications. Replaces `INotifier`. */
export interface NotifyClient {
	user(user: UserId, message: SendMessageInput): Promise<void>;
	room(room: RoomId, message: SendMessageInput): Promise<void>;
	/** Show a typing indicator; resolves to a stop function. */
	typing(opts: { room: RoomId; asUser?: UserId }): Promise<() => Promise<void>>;
}

/**
 * Typed access to the app's own settings.
 *
 * `TSettings` is the value-map inferred from `defineSettings(...)`, so
 * `ctx.settings.get('maxItems')` is typed `number`, not `unknown` — a direct
 * improvement over legacy `getEnvironmentReader().getSettings().getValueById(id)`
 * which returned `any`.
 */
export interface SettingsClient<TSettings extends Record<string, unknown>> {
	get<K extends keyof TSettings>(key: K): Promise<TSettings[K]>;
	getAll(): Promise<TSettings>;
	/** Update one of the app's own settings (replaces IEnvironmentWrite.getSettings().updateValue). */
	set<K extends keyof TSettings>(key: K, value: TSettings[K]): Promise<void>;
}

/** Read-only access to server settings and environment variables (allow-listed). */
export interface EnvironmentReader {
	serverSetting<T = unknown>(id: string): Promise<T | undefined>;
	envVar(name: string): Promise<string | undefined>;
}

/** Workspace cloud token, for calling Rocket.Chat cloud services. */
export interface CloudClient {
	workspaceToken(scope?: string): Promise<{ token: string; expiresAt: Date }>;
}

/* ------------------------------------------------------------------ *
 * Typed persistence (the store).
 *
 * Legacy persistence was an untyped key/value bag keyed by "associations"
 * (`create(data)`, `readByAssociation(assoc)`). The SDK exposes typed
 * collections declared with `defineStore(...)`; each supports familiar CRUD +
 * query. Associations survive as an optional per-record tag so app data can be
 * garbage-collected when the room/message/user it hangs off is deleted.
 * ------------------------------------------------------------------ */

export type Association =
	| { model: 'room'; id: RoomId }
	| { model: 'message'; id: MessageId }
	| { model: 'user'; id: UserId }
	| { model: 'upload'; id: UploadId }
	| { model: 'misc'; id: string };

export interface Collection<T extends object> {
	insert(doc: T, opts?: { associations?: Association[] }): Promise<string>;
	get(id: string): Promise<(T & { _id: string }) | undefined>;
	find(query?: Partial<T>, opts?: PageOpts): Promise<(T & { _id: string })[]>;
	findByAssociation(assoc: Association): Promise<(T & { _id: string })[]>;
	update(id: string, patch: Partial<T>, opts?: { upsert?: boolean }): Promise<void>;
	delete(id: string): Promise<boolean>;
}

export type StoreClient<TStore extends Record<string, object>> = {
	readonly [K in keyof TStore]: Collection<TStore[K]>;
};

/* ------------------------------------------------------------------ *
 * Scheduler client — imperative scheduling of declared jobs.
 *
 * Mirrors Mastra's `mastra.schedules.create/list/delete`, but jobs are passed
 * by *reference* (the `defineJob` object) so the data payload is type-checked
 * against the job's own input schema — legacy `scheduleOnce({ id, data })` took
 * `data?: object` untyped and a stringly-typed job id.
 * ------------------------------------------------------------------ */

export interface SchedulerClient {
	/** One-time run at/after a date (or ISO string). */
	runAt<J extends JobRef>(job: J, when: Date | string, data: JobData<J>): Promise<string>;
	/** Recurring run on a cron expression or human interval ('1 hour'). */
	runEvery<J extends JobRef>(job: J, interval: string, data: JobData<J>, opts?: { skipImmediate?: boolean }): Promise<string>;
	cancel(scheduleId: string): Promise<void>;
	cancelAll(): Promise<void>;
	list(): Promise<ScheduledJobInfo[]>;
}

export interface ScheduledJobInfo {
	id: string;
	jobId: string;
	cron?: string;
	interval?: string;
	nextRunAt?: Date;
}

/** Minimal structural view of a job definition (avoids an import cycle with jobs.ts). */
export interface JobRef {
	readonly id: string;
	readonly inputSchema?: Schema;
}
export type JobData<J extends JobRef> = InferArg<J['inputSchema'], undefined>;

/** Interactive surfaces (modals, contextual bars). Detailed in ui.ts. */
export interface UiClient {
	/**
	 * Open a surface and (optionally) await its result.
	 *
	 * The awaited form is the SDK's headline UI improvement: it uses the
	 * runtime's durable suspend/resume machinery (Mastra's `suspend()`), so a
	 * modal submit that arrives as a *separate* interaction request resolves the
	 * very `await` that opened it — no manual view-id ↔ handler correlation.
	 */
	open<S extends OpenSurface<any>>(surface: S, opts: { triggerId: string; user: UserId }): Promise<SurfaceResult<S>>;
	/** Fire-and-forget open (e.g. showing a home surface); no result awaited. */
	show<S extends OpenSurface<any>>(surface: S, opts: { user: UserId }): Promise<void>;
}

/* ------------------------------------------------------------------ *
 * The context itself.
 * ------------------------------------------------------------------ */

/** Paging options common to list/query methods. */
export interface PageOpts {
	limit?: number;
	skip?: number;
}

/** The base context injected into every executable. */
export interface AppContext<Env extends AppEnv = BaseEnv> {
	readonly app: AppIdentity;
	readonly logger: Logger;
	readonly http: HttpClient;
	readonly store: StoreClient<Env['store']>;
	readonly settings: SettingsClient<Env['settings']>;
	readonly env: EnvironmentReader;
	readonly cloud: CloudClient;

	readonly messages: MessagesClient;
	readonly rooms: RoomsClient;
	readonly users: UsersClient;
	readonly uploads: UploadsClient;
	readonly threads: ThreadsClient;
	readonly roles: RolesClient;
	readonly contacts: ContactsClient;
	readonly livechat: LivechatClient;
	readonly videoConf: VideoConfClient;
	readonly moderation: ModerationClient;
	readonly oauthApps: OAuthAppsClient;

	readonly notify: NotifyClient;
	readonly ui: UiClient;
	readonly scheduler: SchedulerClient;
}
