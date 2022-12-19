import type {
	AtLeast,
	ICreatedRoom,
	IMessage,
	IRoom,
	ISetting,
	ISubscription,
	ISupportedLanguage,
	IUser,
	RoomType,
} from '@rocket.chat/core-typings';

import type { TranslationKey } from '../TranslationContext';
import type {
	AddWebdavAccount,
	GetWebdavFileList,
	UploadFileToWebdav,
	RemoveWebdavAccount,
	GetWebdavFilePreview,
	GetFileFromWebdav,
} from './methods/webdav';
import type { FollowMessageMethod } from './methods/followMessage';
import type { GetReadReceiptsMethod } from './methods/getReadReceipts';
import type { JoinRoomMethod } from './methods/joinRoom';
import type { UnsubscribeMethod as MailerUnsubscribeMethod } from './methods/mailer/unsubscribe';
import type { RoomNameExistsMethod } from './methods/roomNameExists';
import type { SaveRoomSettingsMethod } from './methods/saveRoomSettings';
import type { SaveSettingsMethod } from './methods/saveSettings';
import type { SaveUserPreferencesMethod } from './methods/saveUserPreferences';
import type { UnfollowMessageMethod } from './methods/message/unfollowMessage';
import type { ReportMessageMethod } from './methods/message/reportMessage';

// TODO: frontend chapter day - define methods

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ServerMethods {
	'2fa:checkCodesRemaining': (...args: any[]) => any;
	'2fa:disable': (...args: any[]) => any;
	'2fa:enable': (...args: any[]) => any;
	'2fa:regenerateCodes': (...args: any[]) => any;
	'2fa:validateTempToken': (...args: any[]) => any;
	'addOAuthApp': (...args: any[]) => any;
	'addOAuthService': (...args: any[]) => any;
	'addUsersToRoom': (...args: any[]) => any;
	'addWebdavAccount': AddWebdavAccount;
	'apps/go-enable': (...args: any[]) => any;
	'apps/is-enabled': (...args: any[]) => any;
	'authorization:addPermissionToRole': (...args: any[]) => any;
	'authorization:addUserToRole': (...args: any[]) => any;
	'authorization:deleteRole': (...args: any[]) => any;
	'authorization:removeRoleFromPermission': (...args: any[]) => any;
	'authorization:removeUserFromRole': (...args: any[]) => any;
	'authorization:saveRole': (...args: any[]) => any;
	'bbbEnd': (...args: any[]) => any;
	'bbbJoin': (...args: any[]) => any;
	'blockUser': (...args: any[]) => any;
	'checkUsernameAvailability': (...args: any[]) => any;
	'cleanRoomHistory': (...args: any[]) => any;
	'clearIntegrationHistory': (...args: any[]) => any;
	'cloud:checkRegisterStatus': () => {
		connectToCloud: string;
		workspaceRegistered: string;
		workspaceId: string;
		uniqueId: string;
		token: string;
		email: string;
	};
	'cloud:checkUserLoggedIn': (...args: any[]) => any;
	'cloud:connectWorkspace': (...args: any[]) => any;
	'cloud:disconnectWorkspace': (...args: any[]) => any;
	'cloud:finishOAuthAuthorization': (...args: any[]) => any;
	'cloud:getOAuthAuthorizationUrl': (...args: any[]) => any;
	'cloud:getWorkspaceRegisterData': (...args: any[]) => any;
	'cloud:logout': (...args: any[]) => any;
	'cloud:registerWorkspace': (...args: any[]) => any;
	'cloud:syncWorkspace': (...args: any[]) => any;
	'createDirectMessage': (...usernames: Exclude<IUser['username'], undefined>[]) => ICreatedRoom;
	'deleteCustomSound': (...args: any[]) => any;
	'deleteCustomUserStatus': (...args: any[]) => any;
	'deleteFileMessage': (...args: any[]) => any;
	'deleteMessage': ({ _id }: Pick<IMessage, '_id'>) => void;
	'deleteOAuthApp': (...args: any[]) => any;
	'deleteUserOwnAccount': (...args: any[]) => any;
	'e2e.resetOwnE2EKey': (...args: any[]) => any;
	'eraseRoom': (...args: any[]) => any;
	'followMessage': FollowMessageMethod;
	'getAvatarSuggestion': (...args: any[]) => any;
	'getFileFromWebdav': GetFileFromWebdav;
	'getMessages': (messages: IMessage['_id'][]) => IMessage[];
	'getRoomByTypeAndName': (
		type: RoomType,
		name: string,
	) => Pick<
		IRoom,
		| '_id'
		| 'name'
		| 'fname'
		| 't'
		| 'cl'
		| 'u'
		| 'lm'
		| 'teamId'
		| 'teamMain'
		| 'topic'
		| 'announcement'
		| 'announcementDetails'
		| 'muted'
		| 'unmuted'
		| '_updatedAt'
		| 'archived'
		| 'description'
		| 'default'
		| 'lastMessage'
		| 'prid'
		| 'avatarETag'
		| 'usersCount'
		| 'msgs'
		| 'open'
		| 'ro'
		| 'reactWhenReadOnly'
		| 'sysMes'
		| 'streamingOptions'
		| 'broadcast'
		| 'encrypted'
		| 'e2eKeyId'
		| 'servedBy'
		| 'ts'
		| 'federated'
		| 'usernames'
		| 'uids'
	>;
	'getRoomRoles': (rid: IRoom['_id']) => ISubscription[];
	'getSetupWizardParameters': () => {
		settings: ISetting[];
		serverAlreadyRegistered: boolean;
		hasAdmin: boolean;
	};
	'getSingleMessage': (mid: IMessage['_id']) => IMessage;
	'getThreadMessages': (params: { tmid: IMessage['_id'] }) => IMessage[];
	'getUsersOfRoom': (...args: any[]) => any;
	'getWebdavFileList': GetWebdavFileList;
	'getWebdavFilePreview': GetWebdavFilePreview;
	'hideRoom': (...args: any[]) => any;
	'ignoreUser': (...args: any[]) => any;
	'insertOrUpdateSound': (args: { previousName?: string; name?: string; _id?: string; extension: string }) => string;
	'insertOrUpdateUserStatus': (...args: any[]) => any;
	'instances/get': (...args: any[]) => any;
	'joinRoom': JoinRoomMethod;
	'leaveRoom': (...args: any[]) => any;
	'loadHistory': (
		rid: IRoom['_id'],
		ts?: Date,
		limit?: number,
		ls?: number,
		showThreadMessages?: boolean,
	) => {
		messages: IMessage[];
		firstUnread: IMessage;
		unreadNotLoaded: number;
	};
	'loadMissedMessages': (rid: IRoom['_id'], ts: Date) => IMessage[];
	'loadNextMessages': (
		rid: IRoom['_id'],
		end?: Date,
		limit?: number,
	) => {
		messages: IMessage[];
	};
	'loadSurroundingMessages': (
		message: Pick<IMessage, '_id' | 'rid'> & { ts?: Date },
		limit?: number,
	) => {
		messages: IMessage[];
		moreBefore: boolean;
		moreAfter: boolean;
	};
	'logoutCleanUp': (user: IUser) => void;
	'Mailer.sendMail': (from: string, subject: string, body: string, dryrun: boolean, query: string) => any;
	'muteUserInRoom': (...args: any[]) => any;
	'openRoom': (rid: IRoom['_id']) => ISubscription;
	'personalAccessTokens:generateToken': (...args: any[]) => any;
	'personalAccessTokens:regenerateToken': (...args: any[]) => any;
	'personalAccessTokens:removeToken': (...args: any[]) => any;
	'e2e.requestSubscriptionKeys': (...args: any[]) => any;
	'readMessages': (...args: any[]) => any;
	'refreshClients': (...args: any[]) => any;
	'refreshOAuthService': (...args: any[]) => any;
	'registerUser': (...args: any[]) => any;
	'removeOAuthService': (...args: any[]) => any;
	'removeWebdavAccount': RemoveWebdavAccount;
	'removeCannedResponse': (...args: any[]) => any;
	'replayOutgoingIntegration': (...args: any[]) => any;
	'reportMessage': ReportMessageMethod;
	'requestDataDownload': (...args: any[]) => any;
	'resetPassword': (...args: any[]) => any;
	'roomNameExists': RoomNameExistsMethod;
	'saveCannedResponse': (...args: any[]) => any;
	'saveRoomSettings': SaveRoomSettingsMethod;
	'saveSettings': SaveSettingsMethod;
	'saveUserPreferences': SaveUserPreferencesMethod;
	'saveUserProfile': (...args: any[]) => any;
	'sendConfirmationEmail': (...args: any[]) => any;
	'sendInvitationEmail': (...args: any[]) => any;
	'sendMessage': (message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>) => any;
	'setAdminStatus': (...args: any[]) => any;
	'setAsset': (...args: any[]) => any;
	'setAvatarFromService': (...args: any[]) => any;
	'setReaction': (reaction: string, mid: IMessage['_id']) => void;
	'setUsername': (...args: any[]) => any;
	'setUserPassword': (...args: any[]) => any;
	'setUserStatus': (statusType: IUser['status'], statusText: IUser['statusText']) => void;
	'slashCommand': (params: { cmd: string; params: string; msg: IMessage; triggerId: string }) => unknown;
	'toggleFavorite': (...args: any[]) => any;
	'unblockUser': (...args: any[]) => any;
	'unfollowMessage': UnfollowMessageMethod;
	'unmuteUserInRoom': (...args: any[]) => any;
	'unreadMessages': (...args: any[]) => any;
	'unsetAsset': (...args: any[]) => any;
	'updateIncomingIntegration': (...args: any[]) => any;
	'updateMessage': (message: Pick<IMessage, '_id'> & Partial<Omit<IMessage, '_id'>>) => void;
	'updateOAuthApp': (...args: any[]) => any;
	'updateOutgoingIntegration': (...args: any[]) => any;
	'uploadCustomSound': (...args: any[]) => any;
	'uploadFileToWebdav': UploadFileToWebdav;
	'Mailer:unsubscribe': MailerUnsubscribeMethod;
	'getRoomById': (rid: IRoom['_id']) => IRoom;
	'getReadReceipts': GetReadReceiptsMethod;
	'checkRegistrationSecretURL': (hash: string) => boolean;
	'livechat:changeLivechatStatus': (params?: void | { status?: string; agentId?: string }) => unknown;
	'livechat:saveAgentInfo': (_id: string, agentData: unknown, agentDepartments: unknown) => unknown;
	'livechat:takeInquiry': (inquiryId: string, options?: { clientAction: boolean; forwardingToDepartment?: boolean }) => unknown;
	'livechat:resumeOnHold': (roomId: string, options?: { clientAction: boolean }) => unknown;
	'autoTranslate.getProviderUiMetadata': () => Record<string, { name: string; displayName: string }>;
	'autoTranslate.getSupportedLanguages': (language: string) => ISupportedLanguage[];
	'spotlight': (
		...args: (
			| string
			| string[]
			| {
					users: boolean;
					rooms: boolean;
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
		}[];
	};
	'getPasswordPolicy': (params?: { token: string }) => {
		enabled: boolean;
		policy: [name: TranslationKey, options?: Record<string, unknown>][];
	};
}

export type ServerMethodName = keyof ServerMethods;

export type ServerMethodParameters<MethodName extends ServerMethodName> = Parameters<ServerMethods[MethodName]>;

export type ServerMethodReturn<MethodName extends ServerMethodName> = ReturnType<ServerMethods[MethodName]>;

export type ServerMethodFunction<MethodName extends ServerMethodName> = (
	...args: ServerMethodParameters<MethodName>
) => Promise<ServerMethodReturn<MethodName>>;
