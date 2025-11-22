// eslint-disable-next-line @typescript-eslint/naming-convention
import { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';

export interface ServerMethods {
	resetPassword(token: string, password: string): { token: string };
	setUserPassword(password: string): void;
	sendConfirmationEmail(to: string): boolean;
	checkRegistrationSecretURL(hash: string): boolean;
	'passkey:generateAuthenticationOptions'(): { id: string, options: PublicKeyCredentialRequestOptionsJSON };
	'passkey:verifyAuthenticationResponse'(id: string, authenticationResponse: AuthenticationResponseJSON): void;
}

export type ServerMethodName = keyof ServerMethods;

export type ServerMethodParameters<MethodName extends ServerMethodName> = Parameters<ServerMethods[MethodName]>;

export type ServerMethodReturn<MethodName extends ServerMethodName> = Awaited<ReturnType<ServerMethods[MethodName]>>;
