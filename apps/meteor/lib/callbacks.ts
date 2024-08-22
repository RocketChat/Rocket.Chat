import type {
	IMessage,
	IRoom,
	IUser,
	ILivechatDepartmentRecord,
	ILivechatAgent,
	OmnichannelAgentStatus,
	ILivechatInquiryRecord,
	ILivechatVisitor,
	VideoConference,
	OEmbedMeta,
	OEmbedUrlContent,
	Username,
	IOmnichannelRoom,
	ILivechatTag,
	SelectedAgent,
	InquiryWithAgentInfo,
	ILivechatTagRecord,
	TransferData,
	AtLeast,
	UserStatus,
	ILivechatDepartment,
	MessageMention,
	OmnichannelSourceType,
} from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import type { FilterOperators } from 'mongodb';

import type { ILoginAttempt } from '../app/authentication/server/ILoginAttempt';
import type { IBusinessHourBehavior } from '../app/livechat/server/business-hour/AbstractBusinessHour';
import type { CloseRoomParams } from '../app/livechat/server/lib/LivechatTyped';
import { Callbacks } from './callbacks/callbacksBase';

/**
 * Callbacks returning void, like event listeners.
 *
 * TODO: move those to event-based systems
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface EventLikeCallbackSignatures {
	'afterActivateUser': (user: IUser) => void;
	'afterCreateChannel': (owner: IUser, room: IRoom) => void;
	'afterCreatePrivateGroup': (owner: IUser, room: IRoom) => void;
	'afterDeactivateUser': (user: IUser) => void;
	'afterDeleteMessage': (message: IMessage, room: IRoom) => void;
	'workspaceLicenseChanged': (license: string) => void;
	'workspaceLicenseRemoved': () => void;
	'afterReadMessages': (rid: IRoom['_id'], params: { uid: IUser['_id']; lastSeen?: Date; tmid?: IMessage['_id'] }) => void;
	'beforeReadMessages': (rid: IRoom['_id'], uid: IUser['_id']) => void;
	'afterDeleteUser': (user: IUser) => void;
	'afterFileUpload': (params: { user: IUser; room: IRoom; message: IMessage }) => void;
	'afterRoomNameChange': (params: { rid: string; name: string; oldName: string }) => void;
	'afterSaveMessage': (message: IMessage, params: { room: IRoom; uid?: string; roomUpdater?: Updater<IRoom> }) => void;
	'afterOmnichannelSaveMessage': (message: IMessage, constant: { room: IOmnichannelRoom; roomUpdater: Updater<IOmnichannelRoom> }) => void;
	'livechat.removeAgentDepartment': (params: { departmentId: ILivechatDepartmentRecord['_id']; agentsId: ILivechatAgent['_id'][] }) => void;
	'livechat.saveAgentDepartment': (params: { departmentId: ILivechatDepartmentRecord['_id']; agentsId: ILivechatAgent['_id'][] }) => void;
	'livechat.closeRoom': (params: { room: IOmnichannelRoom; options: CloseRoomParams['options'] }) => void;
	'livechat:afterReturnRoomAsInquiry': (params: { room: IRoom }) => void;
	'livechat.setUserStatusLivechat': (params: { userId: IUser['_id']; status: OmnichannelAgentStatus }) => void;
	'livechat.agentStatusChanged': (params: { userId: IUser['_id']; status: UserStatus }) => void;
	'livechat.onNewAgentCreated': (agentId: string) => void;
	'livechat.afterTakeInquiry': (
		params: { inquiry: InquiryWithAgentInfo; room: IOmnichannelRoom },
		agent: { agentId: string; username: string },
	) => void;
	'livechat.afterAgentRemoved': (params: { agent: Pick<IUser, '_id' | 'username'> }) => void;
	'afterAddedToRoom': (params: { user: IUser; inviter?: IUser }, room: IRoom) => void;
	'beforeAddedToRoom': (params: {
		user: AtLeast<IUser, '_id' | 'federated' | 'roles'>;
		inviter: AtLeast<IUser, '_id' | 'username'>;
	}) => void;
	'afterCreateDirectRoom': (params: IRoom, second: { members: IUser[]; creatorId: IUser['_id'] }) => void;
	'beforeDeleteRoom': (params: IRoom) => void;
	'beforeJoinDefaultChannels': (user: IUser) => void;
	'beforeCreateChannel': (owner: IUser, room: IRoom) => void;
	'afterCreateRoom': (owner: IUser, room: IRoom) => void;
	'onValidateLogin': (login: ILoginAttempt) => void;
	'federation.afterCreateFederatedRoom': (room: IRoom, second: { owner: IUser; originalMemberList: string[] }) => void;
	'beforeCreateDirectRoom': (members: IUser[]) => void;
	'federation.beforeCreateDirectMessage': (members: IUser[]) => void;
	'afterSetReaction': (message: IMessage, { user, reaction }: { user: IUser; reaction: string; shouldReact: boolean }) => void;
	'afterUnsetReaction': (
		message: IMessage,
		{ user, reaction }: { user: IUser; reaction: string; shouldReact: boolean; oldMessage: IMessage },
	) => void;
	'federation.beforeAddUserToARoom': (params: { user: IUser | string; inviter: IUser }, room: IRoom) => void;
	'federation.onAddUsersToARoom': (params: { invitees: IUser[] | Username[]; inviter: IUser }, room: IRoom) => void;
	'onJoinVideoConference': (callId: VideoConference['_id'], userId?: IUser['_id']) => Promise<void>;
	'usernameSet': () => void;
	'beforeJoinRoom': (user: IUser, room: IRoom) => void;
	'beforeMuteUser': (users: { mutedUser: IUser; fromUser: IUser }, room: IRoom) => void;
	'afterMuteUser': (users: { mutedUser: IUser; fromUser: IUser }, room: IRoom) => void;
	'beforeUnmuteUser': (users: { mutedUser: IUser; fromUser: IUser }, room: IRoom) => void;
	'afterUnmuteUser': (users: { mutedUser: IUser; fromUser: IUser }, room: IRoom) => void;
	'afterValidateLogin': (login: { user: IUser }) => void;
	'afterJoinRoom': (user: IUser, room: IRoom) => void;
	'livechat.afterDepartmentDisabled': (department: ILivechatDepartmentRecord) => void;
	'livechat.afterDepartmentArchived': (department: Pick<ILivechatDepartmentRecord, '_id' | 'businessHourId'>) => void;
	'beforeSaveUser': ({ user, oldUser }: { user: IUser; oldUser?: IUser }) => void;
	'afterSaveUser': ({ user, oldUser }: { user: IUser; oldUser?: IUser | null }) => void;
	'livechat.afterTagRemoved': (tag: ILivechatTagRecord) => void;
	'beforeUserImport': (data: { userCount: number }) => void;
	'afterUserImport': (data: { inserted: IUser['_id'][]; updated: IUser['_id']; skipped: number; failed: number }) => void;
}

/**
 * Callbacks that are supposed to be composed like a chain.
 *
 * TODO: develop a middleware alternative and grant independence of execution order
 */
type ChainedCallbackSignatures = {
	'livechat.beforeRoom': (
		roomInfo: Record<string, unknown>,
		extraData?: Record<string, unknown> & { sla?: string },
	) => Record<string, unknown>;
	'livechat.newRoom': (room: IOmnichannelRoom) => IOmnichannelRoom;

	'livechat.beforeForwardRoomToDepartment': <T extends { room: IOmnichannelRoom; transferData?: { department: { _id: string } } }>(
		options: T,
	) => Promise<T>;

	'livechat.beforeRouteChat': (inquiry: ILivechatInquiryRecord, agent?: { agentId: string; username: string }) => ILivechatInquiryRecord;
	'livechat.checkDefaultAgentOnNewRoom': (agent: SelectedAgent, visitor?: ILivechatVisitor) => SelectedAgent | null;

	'livechat.onLoadForwardDepartmentRestrictions': (params: { departmentId: string }) => Record<string, unknown>;

	'livechat.saveInfo': (
		newRoom: IOmnichannelRoom,
		props: { user: Required<Pick<IUser, '_id' | 'username' | 'name'>>; oldRoom: IOmnichannelRoom },
	) => IOmnichannelRoom;

	'livechat.onCheckRoomApiParams': (params: Record<string, unknown>) => Record<string, unknown>;

	'livechat.onLoadConfigApi': (config: { room: IOmnichannelRoom }) => Record<string, unknown>;

	'afterCreateUser': (user: AtLeast<IUser, '_id' | 'username' | 'roles'>) => IUser;
	'afterDeleteRoom': (rid: IRoom['_id']) => IRoom['_id'];
	'livechat:afterOnHold': (room: Pick<IOmnichannelRoom, '_id'>) => Pick<IOmnichannelRoom, '_id'>;
	'livechat:afterOnHoldChatResumed': (room: Pick<IOmnichannelRoom, '_id'>) => Pick<IOmnichannelRoom, '_id'>;
	'livechat:onTransferFailure': (
		room: IRoom,
		params: {
			guest: ILivechatVisitor;
			transferData: TransferData;
			department: AtLeast<ILivechatDepartmentRecord, '_id' | 'fallbackForwardDepartment' | 'name'>;
		},
	) => IOmnichannelRoom | Promise<boolean>;
	'livechat.afterForwardChatToAgent': (params: {
		rid: IRoom['_id'];
		servedBy: { _id: string; ts: Date; username?: string };
		oldServedBy: { _id: string; ts: Date; username?: string };
	}) => {
		rid: IRoom['_id'];
		servedBy: { _id: string; ts: Date; username?: string };
		oldServedBy: { _id: string; ts: Date; username?: string };
	};
	'livechat.afterForwardChatToDepartment': (params: {
		rid: IRoom['_id'];
		newDepartmentId: ILivechatDepartmentRecord['_id'];
		oldDepartmentId: ILivechatDepartmentRecord['_id'];
	}) => {
		rid: IRoom['_id'];
		newDepartmentId: ILivechatDepartmentRecord['_id'];
		oldDepartmentId: ILivechatDepartmentRecord['_id'];
	};
	'livechat.afterInquiryQueued': (inquiry: ILivechatInquiryRecord) => ILivechatInquiryRecord;
	'livechat.afterRemoveDepartment': (params: {
		department: AtLeast<ILivechatDepartment, '_id' | 'businessHourId'>;
		agentsId: ILivechatAgent['_id'][];
	}) => {
		department: AtLeast<ILivechatDepartment, '_id' | 'businessHourId'>;
		agentsId: ILivechatAgent['_id'][];
	};
	'livechat.applySimultaneousChatRestrictions': (_: undefined, params: { departmentId?: ILivechatDepartmentRecord['_id'] }) => undefined;
	'livechat.beforeDelegateAgent': (agent: SelectedAgent | undefined, params?: { department?: string }) => SelectedAgent | null | undefined;
	'livechat.applyDepartmentRestrictions': (
		query: FilterOperators<ILivechatDepartmentRecord>,
		params: { userId: IUser['_id'] },
	) => FilterOperators<ILivechatDepartmentRecord>;
	'livechat.applyRoomRestrictions': (query: FilterOperators<IOmnichannelRoom>) => FilterOperators<IOmnichannelRoom>;
	'livechat.onMaxNumberSimultaneousChatsReached': (inquiry: ILivechatInquiryRecord) => ILivechatInquiryRecord;
	'on-business-hour-start': (params: { BusinessHourBehaviorClass: { new (): IBusinessHourBehavior } }) => {
		BusinessHourBehaviorClass: { new (): IBusinessHourBehavior };
	};
	'renderMessage': <T extends IMessage & { html: string }>(message: T) => T;
	'oembed:beforeGetUrlContent': (data: { urlObj: URL }) => {
		urlObj: URL;
	};
	'oembed:afterParseContent': (data: { url: string; meta: OEmbedMeta; headers: { [k: string]: string }; content: OEmbedUrlContent }) => {
		url: string;
		meta: OEmbedMeta;
		headers: { [k: string]: string };
		content: OEmbedUrlContent;
	};
	'livechat.beforeListTags': () => ILivechatTag[];
	'livechat.offlineMessage': (data: { name: string; email: string; message: string; department?: string; host?: string }) => void;
	'livechat.chatQueued': (room: IOmnichannelRoom) => IOmnichannelRoom;
	'livechat.leadCapture': (room: IOmnichannelRoom) => IOmnichannelRoom;
	'beforeSendMessageNotifications': (message: string) => string;
	'livechat.onAgentAssignmentFailed': (
		room: IOmnichannelRoom,
		params: {
			inquiry: {
				_id: string;
				rid: string;
				status: string;
			};
			options: { forwardingToDepartment?: { oldDepartmentId?: string; transferData?: any }; clientAction?: boolean };
		},
	) => Promise<(IOmnichannelRoom & { chatQueued: boolean }) | undefined>;
	'livechat.beforeInquiry': (
		data: Pick<ILivechatInquiryRecord, 'source'> & { sla?: string; priority?: string; [other: string]: unknown } & {
			customFields?: Record<string, unknown>;
			source?: OmnichannelSourceType;
		},
	) => Pick<ILivechatInquiryRecord, 'source'> & { sla?: string; priority?: string; [other: string]: unknown } & {
		customFields?: Record<string, unknown>;
		source?: OmnichannelSourceType;
	};
	'roomNameChanged': (room: IRoom) => void;
	'roomTopicChanged': (room: IRoom) => void;
	'roomAnnouncementChanged': (room: IRoom) => void;
	'roomTypeChanged': (room: IRoom) => void;
	'archiveRoom': (room: IRoom) => void;
	'unarchiveRoom': (room: IRoom) => void;
	'roomAvatarChanged': (room: IRoom) => void;
	'beforeGetMentions': (mentionIds: string[], teamMentions: MessageMention[]) => Promise<string[]>;
};

export type Hook =
	| keyof EventLikeCallbackSignatures
	| keyof ChainedCallbackSignatures
	| 'afterProcessOAuthUser'
	| 'afterRoomArchived'
	| 'afterRoomTopicChange'
	| 'afterSaveUser'
	| 'afterValidateNewOAuthUser'
	| 'beforeActivateUser'
	| 'beforeReadMessages'
	| 'beforeRemoveFromRoom'
	| 'beforeValidateLogin'
	| 'livechat.beforeForwardRoomToDepartment'
	| 'livechat.chatQueued'
	| 'livechat.checkAgentBeforeTakeInquiry'
	| 'livechat.sendTranscript'
	| 'livechat.closeRoom'
	| 'livechat.offlineMessage'
	| 'livechat.onCheckRoomApiParams'
	| 'livechat.onLoadConfigApi'
	| 'loginPageStateChange'
	| 'mapLDAPUserData'
	| 'onCreateUser'
	| 'onLDAPLogin'
	| 'onValidateLogin'
	| 'openBroadcast'
	| 'renderNotification'
	| 'setReaction'
	| 'streamMessage'
	| 'streamNewMessage'
	| 'unsetReaction'
	| 'userAvatarSet'
	| 'userConfirmationEmailRequested'
	| 'userForgotPasswordEmailRequested'
	| 'usernameSet'
	| 'userPasswordReset'
	| 'userRegistered'
	| 'userStatusManuallySet'
	| 'test';

/**
 * Callback hooks provide an easy way to add extra steps to common operations.
 * @deprecated
 */

export const callbacks = new Callbacks<
	{
		[key in keyof ChainedCallbackSignatures]: ChainedCallbackSignatures[key];
	},
	{
		[key in keyof EventLikeCallbackSignatures]: EventLikeCallbackSignatures[key];
	},
	Hook
>();
