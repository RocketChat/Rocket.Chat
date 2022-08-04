import { CustomOAuth } from '../../custom-oauth';

/**
 * @type {Partial<{
 * 	serverURL: string;
 * 	identityPath: string;
 * 	accessTokenParam: string;
 * 	identityTokenSentVia: string;
 *	authorizePath: string;
 *	tokenPath: string;
 *	scope: string;
 * 	addAutopublishFields: {
 * 		forLoggedInUser: string[];
 * 		forOtherUsers: string[];
 * 	}
 * }>}
 */
export const config = {
	serverURL: '',
	identityPath: '/oauth/me',
	addAutopublishFields: {
		forLoggedInUser: ['services.wordpress'],
		forOtherUsers: ['services.wordpress.user_login'],
	},
	accessTokenParam: 'access_token',
};

export const WordPress = new CustomOAuth('wordpress', config);
