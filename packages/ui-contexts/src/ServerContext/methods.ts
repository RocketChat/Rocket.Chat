import type { IMessage, IRoom, IMessageSearchProvider, IMessageSearchSuggestion, IUser } from '@rocket.chat/core-typings';

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
	'setUsername': (...args: any[]) => any;
	'setUserPassword': (...args: any[]) => any;
	'toggleFavorite': (...args: any[]) => any;
	'unblockUser': (...args: any[]) => any;
	'unmuteUserInRoom': (...args: any[]) => any;
	'unreadMessages': (...args: any[]) => any;
	'updateIncomingIntegration': (...args: any[]) => any;
	'updateOutgoingIntegration': (...args: any[]) => any;
	'checkRegistrationSecretURL'(hash: string): boolean;
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
