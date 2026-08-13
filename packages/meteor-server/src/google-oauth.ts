import { OAuth } from './oauth.ts';

/**
 * Server surface of meteor/google-oauth used by Rocket.Chat:
 * `Google.retrieveCredential` delegates to the pending-credential store.
 */
export const Google = {
	async retrieveCredential(credentialToken: string, credentialSecret: string): Promise<unknown> {
		return OAuth.retrieveCredential(credentialToken, credentialSecret);
	},
};
