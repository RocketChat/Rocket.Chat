import type { Strategy } from 'passport';

export type TokenSentVia = 'header' | 'payload' | 'default';

export interface CustomOAuthOptions {
	serverURL: string;
	tokenPath?: string;
	identityPath?: string;
	authorizePath?: string;
	scope?: string;
	accessTokenParam?: string;
	tokenSentVia?: TokenSentVia;
	identityTokenSentVia?: TokenSentVia;
	keyField?: 'username' | 'email';
	usernameField?: string;
	emailField?: string;
	nameField?: string;
	avatarField?: string;
	mergeUsers?: boolean;
	mergeUsersDistinctServices?: boolean;
	rolesClaim?: string;
	groupsClaim?: string;
	channelsAdmin?: string;
	mapChannels?: boolean;
	channelsMap?: string;
	mergeRoles?: boolean;
	rolesToSync?: string;
	showButton?: boolean;
	buttonLabelText?: string;
	buttonLabelColor?: string;
	buttonColor?: string;
	loginStyle?: string;
}

export interface OAuthServiceConfig {
	provider: string;
	strategy: new (...args: any[]) => Strategy;
	clientId: string;
	clientSecret: string;
	custom?: boolean;
	scope?: string | string[];
	customOptions?: CustomOAuthOptions;
}

export interface NormalizedIdentity {
	id: string;
	email?: string;
	username?: string;
	name?: string;
	avatarUrl?: string;
	[key: string]: unknown;
}

export interface CustomOAuthProfile extends NormalizedIdentity {
	provider: string;
	providerId: string;
	accessToken: string;
	refreshToken?: string;
	idToken?: string;
	expiresAt?: number;
	serverURL?: string;
	_OAuthCustom?: boolean;
}
