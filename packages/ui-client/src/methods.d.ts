import '@rocket.chat/ddp-client';
import type { ISetting } from '@rocket.chat/core-typings';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getSetupWizardParameters(): Promise<{
			settings: ISetting[];
			serverAlreadyRegistered: boolean;
		}>;
		'cloud:getWorkspaceRegisterData': () => string;
		registerUser(
			formData:
				| { email: string; pass: string; username: IUser['username']; name?: string; secretURL?: string; reason?: string }
				| { email?: null },
		):
			| {
					token: string;
					when: Date;
			  }
			| string;
	}
}
