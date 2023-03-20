// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ServerMethods {
	'addUsersToRoom': (...args: any[]) => any;
	'cleanRoomHistory': (...args: any[]) => any;
	'getUsersOfRoom': (...args: any[]) => any;
	'insertOrUpdateUserStatus': (...args: any[]) => any;
	'muteUserInRoom': (...args: any[]) => any;
	'personalAccessTokens:generateToken': (...args: any[]) => any;
	'personalAccessTokens:regenerateToken': (...args: any[]) => any;
	'personalAccessTokens:removeToken': (...args: any[]) => any;
	'registerUser': (...args: any[]) => any;
	'resetPassword': (...args: any[]) => any;
	'saveCannedResponse': (...args: any[]) => any;
	'saveUserProfile': (...args: any[]) => any;
	sendConfirmationEmail(to: string): boolean;
	'setAvatarFromService': (...args: any[]) => any;
	setUserPassword(password: string): void;
	'unmuteUserInRoom': (...args: any[]) => any;
	'unreadMessages': (...args: any[]) => any;
	'updateIncomingIntegration': (...args: any[]) => any;
	'updateOutgoingIntegration': (...args: any[]) => any;
	'checkRegistrationSecretURL'(hash: string): boolean;
	setUsername(username: string, param?: { joinDefaultChannelsSilenced?: boolean }): Promise<string>;
}

export type ServerMethodName = keyof ServerMethods;

export type ServerMethodParameters<MethodName extends ServerMethodName> = Parameters<ServerMethods[MethodName]>;

export type ServerMethodReturn<MethodName extends ServerMethodName> = Awaited<ReturnType<ServerMethods[MethodName]>>;

export type ServerMethodFunction<MethodName extends ServerMethodName> = (
	...args: ServerMethodParameters<MethodName>
) => Promise<ServerMethodReturn<MethodName>>;
