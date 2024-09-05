// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ServerMethods {
	resetPassword(token: string, password: string): { token: string };
	setUserPassword(password: string): void;
	sendConfirmationEmail(to: string): boolean;
	checkRegistrationSecretURL(hash: string): boolean;
}

export type ServerMethodName = keyof ServerMethods;

export type ServerMethodParameters<MethodName extends ServerMethodName> = Parameters<ServerMethods[MethodName]>;

export type ServerMethodReturn<MethodName extends ServerMethodName> = Awaited<ReturnType<ServerMethods[MethodName]>>;
