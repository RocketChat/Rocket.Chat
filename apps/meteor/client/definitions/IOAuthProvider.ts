// Shape mirrors @types/meteor's Meteor.LoginWithExternalServiceOptions —
// the boxed Boolean type is intentional so this stays structurally
// compatible with existing oauth.ts call sites still typed against
// Meteor.LoginWithExternalServiceOptions.
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
export type LoginWithExternalServiceOptions = {
	requestPermissions?: readonly string[] | undefined;
	requestOfflineToken?: Boolean | undefined;
	forceApprovalPrompt?: Boolean | undefined;
	redirectUrl?: string | undefined;
	loginHint?: string | undefined;
	loginStyle?: string | undefined;
};
/* eslint-enable @typescript-eslint/no-wrapper-object-types */

export interface IOAuthProvider {
	readonly name: string;
	requestCredential(
		options: LoginWithExternalServiceOptions | undefined,
		credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
	): void;
}
