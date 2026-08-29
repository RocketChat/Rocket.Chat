/**
 * The host data & query layer — see rfc/20-data-overview.md.
 *
 * `context.ts` gives an app one client per domain. This module says what those
 * clients *are*: how a read states the fields and relations it wants, how the
 * result type is inferred from that request, how the request serializes so the
 * apps runtime can live in another process, and how the host declares each
 * entity once.
 *
 * Three mechanisms, because the domain has three kinds of thing
 * (rfc/21-data-entities.md, "three kinds of thing"):
 *
 * - **Record** (User, Room, Message, Team) → an entity with a client.
 * - **View** (Discussion, Direct room, Thread) → a lens and a type guard over a
 *   record. No client of its own, because it has no record of its own.
 * - **Relation** (room → creator, message → thread, team → rooms) → a declared
 *   traversal, requested per call via `with`.
 *
 * This module is exported under a namespace (`import { data } from
 * '@rocket.chat/app-sdk'`) because it *supersedes* parts of `context.ts` and
 * `models.ts` rather than extending them; §13 of the proposal lists the diffs.
 */

import type { MessageId, RoomId, UploadId, UserId } from './models';

/* ------------------------------------------------------------------ *
 * 1. Identity
 *
 * A thread id *is* a message id. A discussion id *is* a room id. A team id is
 * *not* its main room id. Those three facts are invisible when every id is
 * `string`, which is the argument for branding (proposal §3.3). `Brand` is the
 * helper; whether we apply it everywhere is still an open decision, so the ids
 * below stay compatible with `models.ts`.
 * ------------------------------------------------------------------ */

/** Nominal tag applied at a schema boundary: `z.string().brand<'RoomId'>()`. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** A thread has no record. Its identity is its parent message. */
export type ThreadId = MessageId;

export type TeamId = string;

/** Team carries two ids for one concept, so the client takes a tagged reference. */
export type TeamRef = { readonly teamId: TeamId } | { readonly mainRoomId: RoomId };

/* ------------------------------------------------------------------ *
 * 2. Records
 *
 * Four room types, matching the domain. `discussion` and `team` are *flags*
 * (`parentRoomId`, `teamMain`), not types — a discussion can be public or
 * private, and so can a team (proposal §3.6 and §10.4).
 * ------------------------------------------------------------------ */

export type RoomType = 'channel' | 'private' | 'direct' | 'livechat';

export interface User {
	readonly id: UserId;
	readonly username: string;
	readonly name?: string;
	readonly email?: string;
	readonly roles: readonly string[];
	readonly active: boolean;
}

export interface Room {
	readonly id: RoomId;
	readonly type: RoomType;
	readonly name?: string;
	readonly displayName?: string;
	readonly topic?: string;
	readonly readOnly?: boolean;
	readonly memberCount?: number;
	readonly updatedAt: Date;
	/** Set when the room is a discussion. Its value is the parent room's id. */
	readonly parentRoomId?: RoomId;
	/** Set when the room was opened from a message. */
	readonly parentMessageId?: MessageId;
	/** Set on every room that belongs to a team, main room included. */
	readonly teamId?: TeamId;
	/** True only on the team's main room. */
	readonly teamMain?: boolean;
	/** Direct rooms only. */
	readonly userIds?: readonly UserId[];
}

export interface Message {
	readonly id: MessageId;
	readonly roomId: RoomId;
	readonly senderId: UserId;
	readonly text?: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	/** Set on a reply. Its value is the thread's parent message id. */
	readonly threadId?: ThreadId;
	/** Set when this message opened a discussion. Its value is that room's id. */
	readonly discussionRoomId?: RoomId;
	readonly uploadId?: UploadId;
}

export interface Team {
	readonly id: TeamId;
	readonly name: string;
	readonly mainRoomId: RoomId;
	readonly public: boolean;
	readonly createdAt: Date;
}

/* ------------------------------------------------------------------ *
 * 3. Views — lenses and guards, never clients
 * ------------------------------------------------------------------ */

export type Discussion = Room & { readonly parentRoomId: RoomId };
export type DirectRoom = Room & { readonly type: 'direct'; readonly userIds: readonly UserId[] };

export const isDiscussion = (room: Room): room is Discussion => room.parentRoomId !== undefined;
export const isDirect = (room: Room): room is DirectRoom => room.type === 'direct';
export const isTeamMain = (room: Room): boolean => room.teamMain === true;
export const isInTeam = (room: Room): boolean => room.teamId !== undefined;

/** A thread is a projection over messages: the parent's counters plus its replies. */
export interface ThreadSummary {
	readonly id: ThreadId;
	readonly count: number;
	readonly lastReplyAt: Date;
}

/* ------------------------------------------------------------------ *
 * 4. The entity model
 *
 * An `Entity` is a type-level description: its own fields, the relations you
 * may traverse from it, and the closed set of filters you may query it by.
 * Nothing here exists at runtime; the host mirror is `EntityDescriptor` (§8).
 * ------------------------------------------------------------------ */

export type Cardinality = 'one' | 'maybe' | 'many';

export interface Relation<C extends Cardinality = Cardinality, E extends Entity = Entity> {
	readonly cardinality: C;
	/** Type-level only. `Relation` is never constructed as a value. */
	readonly target: E;
}

export interface Entity {
	readonly fields: object;
	readonly relations: Record<string, Relation>;
	/** The closed filter DSL for this entity. Every property is optional. */
	readonly filters: object;
}

export interface UserEntity extends Entity {
	readonly fields: User;
	readonly relations: Record<never, Relation>;
	readonly filters: {
		readonly username?: string;
		readonly active?: boolean;
		readonly role?: string;
	};
}

export interface RoomEntity extends Entity {
	readonly fields: Room;
	readonly relations: {
		readonly creator: Relation<'maybe', UserEntity>;
		readonly parent: Relation<'maybe', RoomEntity>;
		readonly team: Relation<'maybe', TeamEntity>;
		readonly lastMessage: Relation<'maybe', MessageEntity>;
		readonly members: Relation<'many', UserEntity>;
		readonly discussions: Relation<'many', RoomEntity>;
	};
	readonly filters: {
		readonly type?: RoomType | readonly RoomType[];
		readonly isDiscussion?: boolean;
		readonly parentRoomId?: RoomId;
		readonly teamId?: TeamId;
		readonly nameStartsWith?: string;
	};
}

export interface MessageEntity extends Entity {
	readonly fields: Message;
	readonly relations: {
		readonly sender: Relation<'one', UserEntity>;
		readonly room: Relation<'one', RoomEntity>;
		/** The thread this message *starts*, if it starts one. */
		readonly thread: Relation<'maybe', ThreadEntity>;
		/** The discussion this message opened, if it opened one. */
		readonly discussion: Relation<'maybe', RoomEntity>;
	};
	readonly filters: {
		readonly from?: readonly UserId[];
		readonly since?: Date;
		readonly until?: Date;
		/** A thread reply is still a message in the room; say what you want. */
		readonly threads?: 'include' | 'exclude' | 'only';
		readonly hasUpload?: boolean;
	};
}

/** A view with no record of its own, reachable only from a message. */
export interface ThreadEntity extends Entity {
	readonly fields: ThreadSummary;
	readonly relations: {
		readonly parent: Relation<'one', MessageEntity>;
		readonly replies: Relation<'many', MessageEntity>;
	};
	readonly filters: Record<never, never>;
}

export interface TeamEntity extends Entity {
	readonly fields: Team;
	readonly relations: {
		readonly mainRoom: Relation<'one', RoomEntity>;
		readonly rooms: Relation<'many', RoomEntity>;
		readonly createdBy: Relation<'one', UserEntity>;
	};
	readonly filters: {
		readonly public?: boolean;
		readonly nameStartsWith?: string;
	};
}

/* ------------------------------------------------------------------ *
 * 5. Selection — hydration is an argument, never a property of the type
 *
 * `select` narrows the record's own fields; `with` pulls relations in the same
 * round trip. The result type is inferred from the request, so one entity type
 * serves every call and the platform never ships a shallow twin (proposal §3.4).
 * ------------------------------------------------------------------ */

export interface Selection<E extends Entity> {
	readonly select?: readonly (keyof E['fields'] & string)[];
	readonly with?: { readonly [K in keyof E['relations']]?: true | Selection<E['relations'][K]['target']> };
}

/** The default: every own field, no relations. */
export interface NoSelection {
	readonly select?: undefined;
	readonly with?: undefined;
}

export interface ListSelection<E extends Entity> extends Selection<E> {
	readonly where?: E['filters'];
	readonly pageSize?: number;
	readonly cursor?: string;
	readonly sort?: 'asc' | 'desc';
}

/** The shape a call returns, derived from the selection it passed. */
export type Selected<E extends Entity, S> = SelectedFields<E, S> & SelectedRelations<E, S>;

type SelectedFields<E extends Entity, S> = S extends { readonly select: readonly (infer K)[] }
	? Pick<E['fields'], Extract<K, keyof E['fields']>>
	: E['fields'];

type SelectedRelations<E extends Entity, S> = S extends { readonly with: infer W }
	? { readonly [K in Extract<keyof W, keyof E['relations']>]: ResolveRelation<E['relations'][K], W[K]> }
	: unknown;

type ResolveRelation<R extends Relation, Sub> = R['cardinality'] extends 'many'
	? readonly Selected<R['target'], SubSelection<Sub>>[]
	: R['cardinality'] extends 'maybe'
		? Selected<R['target'], SubSelection<Sub>> | undefined
		: Selected<R['target'], SubSelection<Sub>>;

type SubSelection<Sub> = Sub extends true ? NoSelection : Sub;

/* ------------------------------------------------------------------ *
 * 6. Read clients
 *
 * One client per *record*. `const S` makes `select: ['id', 'name']` infer as a
 * literal tuple, which is what makes the return type exact.
 * ------------------------------------------------------------------ */

export interface Reader<E extends Entity, Id> {
	get<const S extends Selection<E> = NoSelection>(id: Id, selection?: S): Promise<Selected<E, S> | undefined>;
	list<const S extends ListSelection<E> = NoSelection>(selection?: S): AsyncIterable<Selected<E, S>>;
}

/* ------------------------------------------------------------------ *
 * 7. Write commands
 *
 * A write is a value the host applies through a domain operation that owns the
 * invariants. Creating a discussion is a room, a parent message, a link between
 * them, members and events — never `save(entity)` (proposal §3.5).
 * ------------------------------------------------------------------ */

/** Optimistic concurrency: reject rather than lose a concurrent human edit. */
export interface WriteOpts {
	readonly asUser?: UserId;
	readonly ifUnchangedSince?: Date;
}

export interface CreateRoomCommand {
	readonly type: Exclude<RoomType, 'direct' | 'livechat'>;
	readonly name: string;
	readonly displayName?: string;
	readonly members?: readonly string[];
	readonly readOnly?: boolean;
}

export interface CreateDiscussionCommand {
	readonly parentRoom: RoomId;
	readonly parentMessage?: MessageId;
	readonly name: string;
	readonly members?: readonly string[];
	readonly reply?: string;
	readonly private?: boolean;
}

export interface SendMessageCommand {
	readonly room: RoomId;
	readonly text?: string;
	readonly threadId?: ThreadId;
	readonly asUser?: UserId;
}

export interface RoomsClient extends Reader<RoomEntity, RoomId> {
	getByName<const S extends Selection<RoomEntity> = NoSelection>(name: string, selection?: S): Promise<Selected<RoomEntity, S> | undefined>;
	messages<const S extends ListSelection<MessageEntity> = NoSelection>(
		id: RoomId,
		selection?: S,
	): AsyncIterable<Selected<MessageEntity, S>>;

	create(command: CreateRoomCommand): Promise<RoomId>;
	createDiscussion(command: CreateDiscussionCommand): Promise<RoomId>;
	rename(id: RoomId, name: string, opts?: WriteOpts): Promise<void>;
	archive(id: RoomId, opts?: WriteOpts): Promise<void>;
	addMembers(id: RoomId, users: readonly string[], opts?: WriteOpts): Promise<void>;
	removeMembers(id: RoomId, users: readonly string[], opts?: WriteOpts): Promise<void>;
	convertToTeam(id: RoomId, opts?: WriteOpts): Promise<TeamId>;
}

export interface MessagesClient extends Reader<MessageEntity, MessageId> {
	/** A thread is reached from its parent message. There is no `ctx.threads`. */
	replies<const S extends ListSelection<MessageEntity> = NoSelection>(
		parent: ThreadId,
		selection?: S,
	): AsyncIterable<Selected<MessageEntity, S>>;

	send(command: SendMessageCommand): Promise<MessageId>;
	update(id: MessageId, patch: { readonly text?: string }, opts?: WriteOpts): Promise<void>;
	remove(id: MessageId, opts?: WriteOpts): Promise<void>;
	react(id: MessageId, emoji: string, opts?: WriteOpts): Promise<void>;
}

export interface UsersClient extends Reader<UserEntity, UserId> {
	getByUsername<const S extends Selection<UserEntity> = NoSelection>(
		username: string,
		selection?: S,
	): Promise<Selected<UserEntity, S> | undefined>;
	deactivate(id: UserId, opts?: WriteOpts): Promise<void>;
}

/** Team owns a record, so it owns a client. The id duality lives in `TeamRef`. */
export interface TeamsClient extends Omit<Reader<TeamEntity, TeamId>, 'get'> {
	get<const S extends Selection<TeamEntity> = NoSelection>(ref: TeamRef, selection?: S): Promise<Selected<TeamEntity, S> | undefined>;
	rooms<const S extends ListSelection<RoomEntity> = NoSelection>(id: TeamId, selection?: S): AsyncIterable<Selected<RoomEntity, S>>;

	create(command: { readonly name: string; readonly public: boolean; readonly members?: readonly string[] }): Promise<TeamId>;
	addRoom(id: TeamId, room: RoomId, opts?: WriteOpts): Promise<void>;
	removeRoom(id: TeamId, room: RoomId, opts?: WriteOpts): Promise<void>;
}

/** The data half of `ctx`. Replaces `rooms` / `messages` / `users` / `threads`. */
export interface DataClients {
	readonly rooms: RoomsClient;
	readonly messages: MessagesClient;
	readonly users: UsersClient;
	readonly teams: TeamsClient;
}

/* ------------------------------------------------------------------ *
 * 8. The wire contract
 *
 * Every read compiles to one serializable envelope. This is what makes the
 * in-process vs. out-of-process choice a packaging decision (rfc/41-platform-deployment-and-isolation.md).
 * ------------------------------------------------------------------ */

export interface Principal {
	readonly app: string;
	readonly actor?: UserId;
	/** Default `app`. Reading as the actor is permission-gated. */
	readonly as: 'app' | 'actor';
}

export interface DataRequest {
	readonly v: 1;
	readonly entity: string;
	readonly op: 'get' | 'list';
	readonly id?: string;
	readonly select?: readonly string[];
	readonly with?: Readonly<Record<string, unknown>>;
	readonly where?: Readonly<Record<string, unknown>>;
	readonly page?: { readonly size?: number; readonly cursor?: string };
	readonly principal: Principal;
}

/** Proposal §11.1. Enforced on the host, before the request runs. */
export const MAX_RELATION_DEPTH = 2;
export const MAX_PAGE_SIZE = 100;

export class DataBudgetError extends Error {}

/** Depth of a `with` tree, counting the outermost relation as 1. */
export function selectionDepth(withTree: Readonly<Record<string, unknown>> | undefined): number {
	if (!withTree) {
		return 0;
	}
	let deepest = 0;
	for (const sub of Object.values(withTree)) {
		const nested = sub && typeof sub === 'object' ? (sub as Selection<Entity>).with : undefined;
		deepest = Math.max(deepest, 1 + selectionDepth(nested));
	}
	return deepest;
}

/**
 * The erased selection the envelope builder sees. `Selection<E>` is the typed
 * form an app writes; by the time it becomes a request the entity is a string
 * and the keys are strings, which is exactly what has to survive NATS.
 */
export interface ErasedSelection {
	readonly select?: readonly string[];
	readonly with?: Readonly<Record<string, unknown>>;
	readonly where?: Readonly<Record<string, unknown>>;
	readonly pageSize?: number;
	readonly cursor?: string;
}

/** Build the envelope. The client does this; the transport only moves it. */
export function toDataRequest(
	entity: string,
	op: DataRequest['op'],
	principal: Principal,
	selection?: ErasedSelection,
	id?: string,
): DataRequest {
	return {
		v: 1,
		entity,
		op,
		principal,
		...(id !== undefined && { id }),
		...(selection?.select && { select: selection.select }),
		...(selection?.with && { with: selection.with }),
		...(selection?.where && { where: selection.where }),
		...((selection?.pageSize !== undefined || selection?.cursor !== undefined) && {
			page: { size: selection.pageSize, cursor: selection.cursor },
		}),
	};
}

export function assertWithinBudget(request: DataRequest): void {
	const depth = selectionDepth(request.with);
	if (depth > MAX_RELATION_DEPTH) {
		throw new DataBudgetError(`relation depth ${depth} exceeds ${MAX_RELATION_DEPTH}`);
	}
	const size = request.page?.size;
	if (size !== undefined && size > MAX_PAGE_SIZE) {
		throw new DataBudgetError(`page size ${size} exceeds ${MAX_PAGE_SIZE}`);
	}
	if (request.op === 'list' && !request.where) {
		throw new DataBudgetError(`an unfiltered ${request.entity} list needs an explicit permission`);
	}
}

/* ------------------------------------------------------------------ *
 * 9. The host declaration
 *
 * One declaration per entity yields the projection, the loader plan, the JSON
 * Schema for the envelope, and the permission gate. It is the only place that
 * knows a discussion is a parent-room pointer (proposal §9.1).
 * ------------------------------------------------------------------ */

export type RelationVia =
	| { readonly localKey: string }
	| { readonly foreignKey: string }
	| { readonly through: string; readonly localKey: string; readonly foreignKey: string };

export interface RelationDescriptor {
	readonly cardinality: Cardinality;
	readonly target: string;
	readonly via: RelationVia;
}

export function belongsTo(target: string, localKey: string, required = false): RelationDescriptor {
	return { cardinality: required ? 'one' : 'maybe', target, via: { localKey } };
}

export function hasMany(target: string, via: RelationVia): RelationDescriptor {
	return { cardinality: 'many', target, via };
}

export interface EntityDescriptor {
	readonly name: string;
	/** Storage fields this entity exposes, mapped to their public names. */
	readonly fields: Readonly<Record<string, string>>;
	readonly relations: Readonly<Record<string, RelationDescriptor>>;
	/** The closed filter DSL. A key absent here cannot be queried. */
	readonly filters: readonly string[];
	/** The write catalog. A command absent here does not exist. */
	readonly commands: readonly string[];
	readonly policy: {
		readonly read: string;
		readonly field?: Readonly<Record<string, string>>;
	};
}

export function defineEntity<const D extends EntityDescriptor>(descriptor: D): D {
	return descriptor;
}

/** Worked example: everything the host needs to know about a room, once. */
export const roomEntity = defineEntity({
	name: 'room',
	fields: {
		id: '_id',
		type: 't',
		name: 'name',
		displayName: 'fname',
		topic: 'topic',
		readOnly: 'ro',
		memberCount: 'usersCount',
		updatedAt: '_updatedAt',
		parentRoomId: 'prid',
		teamId: 'teamId',
		teamMain: 'teamMain',
		userIds: 'uids',
	},
	relations: {
		creator: belongsTo('user', 'u._id'),
		parent: belongsTo('room', 'prid'),
		team: belongsTo('team', 'teamId'),
		lastMessage: belongsTo('message', 'lastMessage._id'),
		members: hasMany('user', { through: 'subscription', localKey: '_id', foreignKey: 'rid' }),
		discussions: hasMany('room', { foreignKey: 'prid' }),
	},
	filters: ['type', 'isDiscussion', 'parentRoomId', 'teamId', 'nameStartsWith'],
	commands: ['create', 'createDiscussion', 'rename', 'archive', 'addMembers', 'removeMembers', 'convertToTeam'],
	policy: {
		read: 'canSeeRoom',
		field: { topic: 'view-room-administration' },
	},
});

/* ------------------------------------------------------------------ *
 * 10. The host gateway
 *
 * Policy, then projection, then the batched load. The loader lives for one
 * execution, so it also gives read-your-writes inside a handler and needs no
 * staleness contract (proposal §9.2, §11.3).
 * ------------------------------------------------------------------ */

export interface Loader {
	/** One query per relation per page, never one per row. */
	loadMany(entity: string, ids: readonly string[], select?: readonly string[]): Promise<readonly object[]>;
	/** Dropped when the execution ends. Invalidated by any command it issues. */
	invalidate(entity: string, id: string): void;
}

export interface EntityGateway {
	readonly descriptor: EntityDescriptor;
	get(request: DataRequest, loader: Loader): Promise<object | undefined>;
	list(request: DataRequest, loader: Loader): AsyncIterable<object>;
	run(command: string, input: unknown, principal: Principal): Promise<unknown>;
}

/** The transport seam. A local implementation calls the gateway directly; a
 * remote one publishes the envelope to `rocketchat.apps.data.<entity>.<op>`. */
export interface DataTransport {
	read(request: DataRequest): Promise<unknown>;
	write(entity: string, command: string, input: unknown, principal: Principal): Promise<unknown>;
}
