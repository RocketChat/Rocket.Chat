import { Accounts } from 'meteor/accounts-base';
import { OAuth, type HandledOauthRequest } from 'meteor/oauth';

export const registerOAuth2Service = (
	serviceName: string,
	handleOauthRequest: (query: Record<string, any>) => Promise<HandledOauthRequest>,
) => {
	Accounts.oauth.registerService(serviceName);
	OAuth.registerService(serviceName, 2, null, handleOauthRequest);
};
