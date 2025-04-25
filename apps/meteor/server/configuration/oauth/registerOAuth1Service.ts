import { Accounts } from 'meteor/accounts-base';
import { OAuth, type IOAuth1Binding, type IOAuth1Urls, type HandledOauthRequest } from 'meteor/oauth';

export const registerOAuth1Service = (
	serviceName: string,
	urls: IOAuth1Urls,
	handleOauthRequest: (binding: IOAuth1Binding, query?: Record<string, any>) => Promise<HandledOauthRequest>,
) => {
	Accounts.oauth.registerService(serviceName);
	OAuth.registerService(serviceName, 1, urls, handleOauthRequest);
};
