import { OAuthApps } from '@rocket.chat/models';
import { Mongo } from 'meteor/mongo';
import type {
	AuthorizationCode,
	AuthorizationCodeModel,
	Client,
	Falsey,
	RefreshToken,
	RefreshTokenModel,
	Token,
	User,
} from 'oauth2-server';

type AuthCode = {
	_id?: string;
	authCode: string;
	clientId: string;
	userId: string;
	expires: Date;
	redirectUri: string;
};

type ClientModel = {
	_id: string;
	name: string;
	redirectUri: string;
	active: boolean;
	clientId: string;
	clientSecret: string;
	_createdAt: Date;
	_updatedAt: Date;
	_createdBy: {
		_id: string;
		username: string;
	};
};

type AccessTokenModel = {
	accessToken: string;
	refreshToken?: string;
	accessTokenExpiresAt?: Date;
	refreshTokenExpiresAt?: Date;
	clientId: string;
	userId: string;
};

export type ModelConfig = {
	debug?: boolean;
};

export class Model implements AuthorizationCodeModel, RefreshTokenModel {
	private debug: boolean;

	public AccessTokens: Mongo.Collection<AccessTokenModel>;

	public Clients: Mongo.Collection<ClientModel>;

	public AuthCodes: Mongo.Collection<AuthCode>;

	private grants = ['authorization_code', 'refresh_token'];

	constructor(config: ModelConfig = {}) {
		this.debug = !!config.debug;

		this.AccessTokens = new Mongo.Collection('rocketchat_oauth_access_tokens');
		this.Clients = new Mongo.Collection(OAuthApps.col.collectionName);
		this.AuthCodes = new Mongo.Collection('rocketchat_oauth_auth_codes');
	}

	async verifyScope(token: Token, scope: string | string[]): Promise<boolean> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', 'in grantTypeAllowed (clientId:', token.client.id, ', grantType:', `${scope})`);
		}

		if (!Array.isArray(scope)) {
			scope = [scope];
		}

		const allowed = ['authorization_code', 'refresh_token'].filter((t) => scope.includes(t)).length > 0;
		return allowed;
	}

	async getAccessToken(accessToken: string): Promise<Token | Falsey> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', 'in getAccessToken (bearerToken:', accessToken, ')');
		}

		const token = this.AccessTokens.findOne({ accessToken });

		if (!token) {
			return;
		}

		const client = await this.getClient(token.clientId);

		if (!client) {
			throw new Error('Invalid clientId');
		}

		const result: Token = {
			accessToken: token.accessToken,
			client,
			user: {
				id: token.userId,
			},
		};

		return result;
	}

	async getClient(clientId: string, clientSecret?: string): Promise<Client | Falsey> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', 'in getClient (clientId:', clientId, ', clientSecret:', clientSecret, ')');
		}

		let client;
		if (clientSecret == null) {
			client = this.Clients.findOne({ active: true, clientId });
		} else {
			client = this.Clients.findOne({ active: true, clientId, clientSecret });
		}

		if (!client) {
			throw new Error('Invalid clientId');
		}

		const result: Client = {
			grants: this.grants,
			redirectUris: client.redirectUri.split(','),
			id: client.clientId,
		};

		return result;
	}

	async getAuthorizationCode(authorizationCode: string): Promise<AuthorizationCode | Falsey> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', `in getAuthorizationCode (authCode: ${authorizationCode})`);
		}

		const code = this.AuthCodes.findOne({ authCode: authorizationCode });
		if (!code) {
			throw new Error('Invalid authCode');
		}

		const client = await this.getClient(code.clientId);

		if (!client) {
			throw new Error('Invalid clientId');
		}

		const authCode: AuthorizationCode = {
			authorizationCode,
			expiresAt: code.expires,
			user: {
				id: code.userId,
			},
			client: {
				id: client.id,
				grants: client.grants,
			},
			redirectUri: code.redirectUri,
		};

		return authCode;
	}

	async saveAuthorizationCode(
		code: Pick<AuthorizationCode, 'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope'>,
		client: Client,
		user: User,
	): Promise<AuthorizationCode | Falsey> {
		if (this.debug === true) {
			console.log(
				'[OAuth2Server]',
				'in saveAuthCode (code:',
				code.authorizationCode,
				', clientId:',
				client.id,
				', expires:',
				code.expiresAt,
				', user:',
				user,
				')',
			);
		}

		this.AuthCodes.upsert(
			{ authCode: code.authorizationCode },
			{
				authCode: code.authorizationCode,
				clientId: client.id,
				userId: user.id,
				expires: code.expiresAt,
				redirectUri: code.redirectUri,
			},
		);

		const newCode = {
			...code,
			client,
			user,
		};

		return newCode;
	}

	async saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
		if (this.debug === true) {
			console.log(
				'[OAuth2Server]',
				'in saveToken (token:',
				token.accessToken,
				', refreshToken:',
				token.refreshToken,
				', clientId:',
				client.id,
				', user:',
				user,
				', expires:',
				token.accessTokenExpiresAt,
				', refreshTokenExpires:',
				token.refreshTokenExpiresAt,
				')',
			);
		}

		const tokenId = this.AccessTokens.insert({
			accessToken: token.accessToken,
			refreshToken: token.refreshToken,
			accessTokenExpiresAt: token.accessTokenExpiresAt,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt,
			clientId: client.id,
			userId: user.id,
		});

		const result: Token = {
			id: tokenId,
			accessToken: token.accessToken,
			refreshToken: token.refreshToken,
			accessTokenExpiresAt: token.accessTokenExpiresAt,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt,
			client,
			user,
		};

		// TODO migrate
		// const tokenId = this.RefreshTokens.insert({
		// 	refreshToken: token,
		// 	clientId,
		// 	userId: user.id,
		// 	expires,
		// });

		return result;
	}

	async getRefreshToken(refreshToken: string): Promise<RefreshToken | Falsey> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', `in getRefreshToken (refreshToken: ${refreshToken})`);
		}

		const token = this.AccessTokens.findOne({ refreshToken });

		if (!token) {
			throw new Error('Invalid token');
		}

		const client = await this.getClient(token.clientId);

		if (!client) {
			throw new Error('Invalid clientId');
		}

		const result: RefreshToken = {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			refreshToken: token.refreshToken!,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt,
			client: {
				id: client.id,
				grants: client.grants,
			},
			user: {
				id: token.userId,
			},
		};
		return result;
	}

	async revokeToken(token: RefreshToken | Token): Promise<boolean> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', `in revokeToken (token: ${token.accessToken})`);
		}

		if (token.refreshToken) {
			this.AccessTokens.remove({ refreshToken: token.refreshToken });
		} else {
			this.AccessTokens.remove({ accessToken: token.accessToken });
		}
		return true;
	}

	async revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', `in revokeAuthorizationCode (code: ${code.authorizationCode})`);
		}
		this.AuthCodes.remove({ authCode: code.authorizationCode });
		return true;
	}
}
