import type { IRoom, ISetting, ISupportedLanguage, IUser } from '@rocket.chat/core-typings';
import type { DeleteWriteOpResultObject } from 'mongodb';

import type { AddWebdavAccountMethod } from './methods/addWebdavAccount';
import type { FollowMessageMethod } from './methods/followMessage';
import type { GetReadReceiptsMethod } from './methods/getReadReceipts';
import type { JoinRoomMethod } from './methods/joinRoom';
import type { UnsubscribeMethod as MailerUnsubscribeMethod } from './methods/mailer/unsubscribe';
import type { RoomNameExistsMethod } from './methods/roomNameExists';
import type { SaveRoomSettingsMethod } from './methods/saveRoomSettings';
import type { SaveSettingsMethod } from './methods/saveSettings';
import type { SaveUserPreferencesMethod } from './methods/saveUserPreferences';
import type { UnfollowMessageMethod } from './methods/unfollowMessage';

// TODO: frontend chapter day - define methods

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ServerMethods {
	'2fa:checkCodesRemaining': (...args: any[]) => any;
	'2fa:disable': (...args: any[]) => any;
	'2fa:enable': (...args: any[]) => any;
	'2fa:regenerateCodes': (...args: any[]) => any;
	'2fa:validateTempToken': (...args: any[]) => any;
	'addOAuthApp': (...args: any[]) => any;
	'addOAuthService': (...args: any[]) => any;
	'addUsersToRoom': (...args: any[]) => any;
	'addWebdavAccount': AddWebdavAccountMethod;
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
	'deleteCustomSound': (...args: any[]) => any;
	'deleteCustomUserStatus': (...args: any[]) => any;
	'deleteFileMessage': (...args: any[]) => any;
	'deleteOAuthApp': (...args: any[]) => any;
	'deleteUserOwnAccount': (...args: any[]) => any;
	'e2e.resetOwnE2EKey': (...args: any[]) => any;
	'eraseRoom': (...args: any[]) => any;
	'followMessage': FollowMessageMethod;
	'getAvatarSuggestion': (...args: any[]) => any;
	'getSetupWizardParameters': () => {
		settings: ISetting[];
		serverAlreadyRegistered: boolean;
		hasAdmin: boolean;
	};
	'getUsersOfRoom': (...args: any[]) => any;
	'hideRoom': (...args: any[]) => any;
	'ignoreUser': (...args: any[]) => any;
	'insertOrUpdateSound': (args: { previousName?: string; name?: string; _id?: string; extension: string }) => string;
	'insertOrUpdateUserStatus': (...args: any[]) => any;
	'instances/get': (...args: any[]) => any;
	'jitsi:generateAccessToken': (...args: any[]) => any;
	'jitsi:updateTimeout': (...args: any[]) => any;
	'joinRoom': JoinRoomMethod;
	'leaveRoom': (...args: any[]) => any;
	'Mailer.sendMail': (from: string, subject: string, body: string, dryrun: boolean, query: string) => any;
	'muteUserInRoom': (...args: any[]) => any;
	'personalAccessTokens:generateToken': (...args: any[]) => any;
	'personalAccessTokens:regenerateToken': (...args: any[]) => any;
	'personalAccessTokens:removeToken': (...args: any[]) => any;
	'readMessages': (...args: any[]) => any;
	'refreshClients': (...args: any[]) => any;
	'refreshOAuthService': (...args: any[]) => any;
	'registerUser': (...args: any[]) => any;
	'removeOAuthService': (...args: any[]) => any;
	'removeWebdavAccount': (accountId: string) => DeleteWriteOpResultObject;
	'removeCannedResponse': (...args: any[]) => any;
	'replayOutgoingIntegration': (...args: any[]) => any;
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
	'setAdminStatus': (...args: any[]) => any;
	'setAsset': (...args: any[]) => any;
	'setAvatarFromService': (...args: any[]) => any;
	'setUsername': (...args: any[]) => any;
	'setUserPassword': (...args: any[]) => any;
	'setUserStatus': (statusType: IUser['status'], statusText: IUser['statusText']) => void;
	'toggleFavorite': (...args: any[]) => any;
	'unblockUser': (...args: any[]) => any;
	'unfollowMessage': UnfollowMessageMethod;
	'unmuteUserInRoom': (...args: any[]) => any;
	'unreadMessages': (...args: any[]) => any;
	'unsetAsset': (...args: any[]) => any;
	'updateIncomingIntegration': (...args: any[]) => any;
	'updateOAuthApp': (...args: any[]) => any;
	'updateOutgoingIntegration': (...args: any[]) => any;
	'uploadCustomSound': (...args: any[]) => any;
	'Mailer:unsubscribe': MailerUnsubscribeMethod;
	'getRoomById': (rid: IRoom['_id']) => IRoom;
	'getReadReceipts': GetReadReceiptsMethod;
	'checkRegistrationSecretURL': (hash: string) => boolean;
	'autoTranslate.getProviderUiMetadata': () => Record<string, { name: string; displayName: string }>;
	'autoTranslate.getSupportedLanguages': (language: string) => ISupportedLanguage[];
}

export type ServerMethodName = keyof ServerMethods;

export type ServerMethodParameters<MethodName extends ServerMethodName> = Parameters<ServerMethods[MethodName]>;

export type ServerMethodReturn<MethodName extends ServerMethodName> = ReturnType<ServerMethods[MethodName]>;

export type ServerMethodFunction<MethodName extends ServerMethodName> = (
	...args: ServerMethodParameters<MethodName>
) => Promise<ServerMethodReturn<MethodName>>;
