import type {
	IMessage,
	IPermission,
	IRoom,
	IMessageSearchProvider,
	IMessageSearchSuggestion,
	ISetting,
	ISubscription,
	IUser,
} from '@rocket.chat/core-typings';

import type { TranslationKey } from '../TranslationContext';
import type { GetReadReceiptsMethod } from './methods/getReadReceipts';
import type { UnsubscribeMethod as MailerUnsubscribeMethod } from './methods/mailer/unsubscribe';

// TODO: frontend chapter day - define methods

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ServerMethods {
	'addOAuthService': (...args: any[]) => any;
	'addUsersToRoom': (...args: any[]) => any;
	'bbbEnd': (...args: any[]) => any;
	'bbbJoin': (...args: any[]) => any;
	'blockUser': (...args: any[]) => any;
	'checkUsernameAvailability': (...args: any[]) => any;
	'cleanRoomHistory': (...args: any[]) => any;
	'clearIntegrationHistory': (...args: any[]) => any;
	'deleteCustomUserStatus': (...args: any[]) => any;
	'deleteFileMessage': (...args: any[]) => any;
	'deleteUserOwnAccount': (...args: any[]) => any;
	'e2e.resetOwnE2EKey': (...args: any[]) => any;
	'eraseRoom': (...args: any[]) => any;
	'getAvatarSuggestion': (...args: any[]) => any;
	'getUsersOfRoom': (...args: any[]) => any;
	'hideRoom': (...args: any[]) => any;
	'ignoreUser': (...args: any[]) => any;
	'insertOrUpdateUserStatus': (...args: any[]) => any;
	'leaveRoom': (...args: any[]) => any;
	'muteUserInRoom': (...args: any[]) => any;
	'personalAccessTokens:generateToken': (...args: any[]) => any;
	'personalAccessTokens:regenerateToken': (...args: any[]) => any;
	'personalAccessTokens:removeToken': (...args: any[]) => any;
	'e2e.requestSubscriptionKeys': (...args: any[]) => any;
	'readMessages': (...args: any[]) => any;
	'refreshOAuthService': (...args: any[]) => any;
	'registerUser': (...args: any[]) => any;
	'removeOAuthService': (...args: any[]) => any;
	'removeCannedResponse': (...args: any[]) => any;
	'replayOutgoingIntegration': (...args: any[]) => any;
	'requestDataDownload': (...args: any[]) => any;
	'resetPassword': (...args: any[]) => any;
	'saveCannedResponse': (...args: any[]) => any;
	'saveUserProfile': (...args: any[]) => any;
	'sendConfirmationEmail': (...args: any[]) => any;
	'setAdminStatus': (...args: any[]) => any;
	'setAvatarFromService': (...args: any[]) => any;
	'setReaction': (reaction: string, mid: IMessage['_id']) => void;
	'setUsername': (...args: any[]) => any;
	'setUserPassword': (...args: any[]) => any;
	'setUserStatus': (statusType: IUser['status'], statusText: IUser['statusText']) => void;
	'slashCommand': (params: { cmd: string; params: string; msg: IMessage; triggerId: string }) => unknown;
	'toggleFavorite': (...args: any[]) => any;
	'unblockUser': (...args: any[]) => any;
	'unmuteUserInRoom': (...args: any[]) => any;
	'unreadMessages': (...args: any[]) => any;
	'updateIncomingIntegration': (...args: any[]) => any;
	'updateOutgoingIntegration': (...args: any[]) => any;
	'Mailer:unsubscribe': MailerUnsubscribeMethod;
	'getRoomById': (rid: IRoom['_id']) => IRoom;
	'getReadReceipts': GetReadReceiptsMethod;
	'checkRegistrationSecretURL': (hash: string) => boolean;
	'livechat:changeLivechatStatus': (params?: void | { status?: string; agentId?: string }) => unknown;
	'livechat:saveAgentInfo': (_id: string, agentData: unknown, agentDepartments: unknown) => unknown;
	'livechat:takeInquiry': (inquiryId: string, options?: { clientAction: boolean; forwardingToDepartment?: boolean }) => unknown;
	'livechat:resumeOnHold': (roomId: string, options?: { clientAction: boolean }) => unknown;
	'spotlight': (
		...args: (
			| string
			| string[]
			| {
					users?: boolean;
					rooms?: boolean;
					mentions?: boolean;
			  }
		)[]
	) => {
		rooms: { _id: string; name: string; t: string; uids?: string[] }[];
		users: {
			_id: string;
			status: 'offline' | 'online' | 'busy' | 'away';
			name: string;
			username: string;
			outside: boolean;
			avatarETag?: string;
			nickname?: string;
		}[];
	};
	'getPasswordPolicy': (params?: { token: string }) => {
		enabled: boolean;
		policy: [name: TranslationKey, options?: Record<string, unknown>][];
	};
	'subscriptions/get': (updatedSince?: Date) => ISubscription[] | { update: ISubscription[]; remove: ISubscription[] };
	'permissions/get': (updatedSince?: Date) => IPermission[] | { update: IPermission[]; remove: IPermission[] };
	'public-settings/get': (updatedSince?: Date) => ISetting[] | { update: ISetting[]; remove: ISetting[] };
	'private-settings/get': (updatedSince?: Date) => ISetting[] | { update: ISetting[]; remove: ISetting[] };
	'pinMessage': (message: IMessage) => void;
	'unpinMessage': (message: IMessage) => void;
	'rocketchatSearch.getProvider': () => IMessageSearchProvider | undefined;
	'rocketchatSearch.search': (
		text: string,
		context: { uid?: IUser['_id']; rid: IRoom['_id'] },
		payload: unknown,
	) => {
		message: {
			docs: IMessage[];
		};
	};
	'rocketchatSearch.suggest': (
		text: string,
		context: { uid?: IUser['_id']; rid: IRoom['_id'] },
		payload: unknown,
	) => IMessageSearchSuggestion[];
}

export type ServerMethodName = keyof ServerMethods;

export type ServerMethodParameters<MethodName extends ServerMethodName> = Parameters<ServerMethods[MethodName]>;

export type ServerMethodReturn<MethodName extends ServerMethodName> = Awaited<ReturnType<ServerMethods[MethodName]>>;

export type ServerMethodFunction<MethodName extends ServerMethodName> = (
	...args: ServerMethodParameters<MethodName>
) => Promise<ServerMethodReturn<MethodName>>;
