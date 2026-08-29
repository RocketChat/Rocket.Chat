/**
 * Domain models an app reads and writes.
 *
 * These are intentionally trimmed, self-contained shapes so this proposal
 * type-checks in isolation. In the real implementation these are re-exported
 * from `@rocket.chat/core-typings` (`IMessage`, `IRoom`, `IUser`, `IUpload`, …)
 * so apps and the server share one source of truth — a deliberate departure
 * from the legacy engine, which maintained a *parallel* set of `definition/`
 * model interfaces that drifted from the server's own types.
 */

// IDs are plain string aliases, matching `@rocket.chat/core-typings`. (Nominal
// branding was considered — it catches "passed a userId where a roomId goes" —
// but it forces casts whenever an id arrives from untyped input like a job
// payload or an HTTP body, so it is left as an optional future enhancement.)
export type UserId = string;
export type RoomId = string;
export type MessageId = string;
export type UploadId = string;

export type RoomType = 'channel' | 'private' | 'direct' | 'livechat' | 'discussion' | 'team';

export interface IUser {
	readonly id: UserId;
	readonly username: string;
	readonly name?: string;
	readonly emails?: { address: string; verified: boolean }[];
	readonly roles: string[];
	readonly type: 'user' | 'bot' | 'app';
	readonly status?: 'online' | 'away' | 'busy' | 'offline';
	readonly active: boolean;
}

export interface IRoom {
	readonly id: RoomId;
	readonly type: RoomType;
	readonly name?: string;
	readonly displayName?: string;
	readonly creatorId?: UserId;
	readonly readOnly?: boolean;
	readonly memberCount?: number;
	readonly customFields?: Record<string, unknown>;
}

export interface IMessageAttachment {
	title?: { value: string; link?: string };
	text?: string;
	color?: string;
	imageUrl?: string;
	fields?: { title: string; value: string; short?: boolean }[];
}

export interface IMessage {
	readonly id: MessageId;
	readonly roomId: RoomId;
	readonly senderId: UserId;
	readonly text?: string;
	readonly threadId?: MessageId;
	readonly createdAt: Date;
	readonly editedAt?: Date;
	readonly attachments?: IMessageAttachment[];
	/** UIKit blocks; authored with `@rocket.chat/ui-kit` helpers (see ui.ts). */
	readonly blocks?: readonly UiBlock[];
	readonly reactions?: Record<string, { usernames: string[] }>;
	readonly customFields?: Record<string, unknown>;
}

export interface IUpload {
	readonly id: UploadId;
	readonly name: string;
	readonly type: string;
	readonly size: number;
	readonly roomId: RoomId;
	readonly userId: UserId;
	readonly url?: string;
}

/**
 * Opaque UIKit block. The concrete block/element union is owned by
 * `@rocket.chat/ui-kit`; the SDK treats a rendered block as an opaque value so
 * this proposal does not re-litigate the (separate, already-in-progress) Block
 * Kit redesign. See `ui.ts` and `rfc/51-open-questions.md`.
 */
export type UiBlock = { readonly type: string; readonly [k: string]: unknown };
