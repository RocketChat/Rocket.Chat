import type { IVisitor } from '../livechat';
import type { IOmnichannelSource, IVisitorChannelInfo } from '../livechat/ILivechatRoom';
import type { IUserLookup } from '../users';
import type { RoomType } from './RoomType';

/**
 * A lightweight representation of a room without resolving relational data.
 * This is intended for listing operations to avoid additional database lookups.
 */
export interface IRoomRaw {
	id: string;
	slugifiedName: string;
	displayName?: string;
	type: RoomType;
	creator?: IUserLookup;
	members?: Array<string>;
	userIds?: Array<string>;
	usernames?: Array<string>;
	isDefault?: boolean;
	isReadOnly?: boolean;
	displaySystemMessages?: boolean;
	messageCount?: number;
	createdAt?: Date;
	updatedAt?: Date;
	closedAt?: Date;
	lastModifiedAt?: Date;
	description?: string;
	customFields?: { [key: string]: any };
	parentRoomId?: string;
	teamId?: string;
	isTeamMain?: boolean;
	livechatData?: { [key: string]: any };
	isWaitingResponse?: boolean;
	isOpen?: boolean;
	closer?: 'user' | 'visitor' | 'bot';
	closedBy?: IUserLookup;
	servedBy?: IUserLookup;
	responseBy?: IUserLookup;
	source?: IOmnichannelSource;
	visitor?: Pick<IVisitor, 'id' | 'token' | 'username' | 'name' | 'status' | 'activity'> & IVisitorChannelInfo;
	departmentId?: string;
	contactId?: string;
}
