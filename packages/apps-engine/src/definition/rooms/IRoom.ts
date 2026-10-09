import type { IAbacAttributeDefinition } from '../abac/AbacAttributes';
import type { FederationLookup } from '../federation';
import type { IUser } from '../users';
import type { RoomType } from './RoomType';

/**
 * A room, as `IRoomRead` returns it.
 *
 * Every conversation in Rocket.Chat is one of these — a channel, a private
 * group, a direct message or a Livechat conversation. Narrow by
 * {@link IRoom.type} before assuming which.
 */
export interface IRoom {
	/** The room's identifier. */
	id: string;
	/** The room's name as users see it, when the workspace allows a separate one. */
	displayName?: string;
	/** The room's name as it appears in a URL and in a mention. */
	slugifiedName: string;
	/** Which kind of room this is. */
	type: RoomType;
	/** Who opened the room. */
	creator: IUser;
	/** The team the room belongs to. */
	teamId?: string;
	/** Whether this room is a team's own room rather than a channel inside it. */
	isTeamMain?: boolean;
	/**
	 * The usernames of the room's members.
	 *
	 * @deprecated usernames will be removed on version 2.0.0
	 */
	usernames: Array<string>;
	/** The ids of the room's members. */
	userIds?: Array<string>;
	/** Whether every new user of the workspace is subscribed to this room. */
	isDefault?: boolean;
	/** Whether only users with the permission to post may write in the room. */
	isReadOnly?: boolean;
	/** Whether the room shows system messages, such as joins and topic changes. */
	displaySystemMessages?: boolean;
	/** How many messages the room holds. */
	messageCount?: number;
	/** When the room was opened. */
	createdAt?: Date;
	/** When the room record last changed. */
	updatedAt?: Date;
	/** When the room last saw activity. */
	lastModifiedAt?: Date;
	/** What the room is for, shown in its header. */
	description?: string;
	/** The values filled into the workspace's custom room fields. */
	customFields?: { [key: string]: any };
	/** The room this one was opened as a discussion of. */
	parentRoom?: IRoom;
	/** The custom fields of the Livechat conversation, on a Livechat room. */
	livechatData?: { [key: string]: any };
	/** Whether the room lives on another server. */
	isFederated?: boolean;
	/** Where a federated room lives. */
	federation?: FederationLookup;

	/** The attributes governing who may reach the room, under attribute-based access control. */
	abacAttributes?: IAbacAttributeDefinition[];
}
