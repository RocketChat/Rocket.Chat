import type {
	AuthorizationCode,
	AuthorizationCodeModel,
	Client,
	Falsey,
	RefreshToken,
	RefreshTokenModel,
	Token,
	User,
} from '@node-oauth/oauth2-server';
import { OAuthApps, OAuthAuthCodes, OAuthAccessTokens, OAuthRefreshTokens } from '@rocket.chat/models';

export type ModelConfig = {
	debug?: boolean;
};

export class Model implements AuthorizationCodeModel, RefreshTokenModel {
	private debug: boolean;

	private grants = ['authorization_code', 'refresh_token'];

	constructor(config: ModelConfig = {}) {
		this.debug = !!config.debug;
	}

	async verifyScope(token: Token, scope: string | string[]): Promise<boolean> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', 'in grantTypeAllowed (clientId:', token.client.id, ', grantType:', `${scope})`);
		}

		if (!Array.isArray(scope)) {
			scope = [scope];
		}

		const allowed = this.grants.filter((t) => scope.includes(t)).length > 0;
		return allowed;
	}

	async getAccessToken(accessToken: string): Promise<Token | Falsey> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', 'in getAccessToken (bearerToken:', accessToken, ')');
		}

		const token = await OAuthAccessTokens.findOneByAccessToken(accessToken);

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
			client = await OAuthApps.findOneActiveByClientId(clientId);
		} else {
			client = await OAuthApps.findOneActiveByClientIdAndClientSecret(clientId, clientSecret);
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

		const code = await OAuthAuthCodes.findOneByAuthCode(authorizationCode);
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

		await OAuthAuthCodes.updateOne(
			{ authCode: code.authorizationCode },
			{
				$set: {
					authCode: code.authorizationCode,
					clientId: client.id,
					userId: user.id,
					expires: code.expiresAt,
					redirectUri: code.redirectUri,
				},
			},
			{ upsert: true },
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

		const tokenId = (
			await OAuthAccessTokens.insertOne({
				accessToken: token.accessToken,
				refreshToken: token.refreshToken,
				expires: token.accessTokenExpiresAt,
				refreshTokenExpiresAt: token.refreshTokenExpiresAt,
				clientId: client.id,
				userId: user.id,
			})
		).insertedId;

		const result: Token = {
			id: tokenId,
			accessToken: token.accessToken,
			refreshToken: token.refreshToken,
			accessTokenExpiresAt: token.accessTokenExpiresAt,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt,
			client,
			user,
		};

		return result;
	}

	async getRefreshToken(refreshToken: string): Promise<RefreshToken | Falsey> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', `in getRefreshToken (refreshToken: ${refreshToken})`);
		}

		// Keep compatibility with old collection
		// Deprecated: Remove on next major within a migration
		const token =
			(await OAuthAccessTokens.findOneByRefreshToken(refreshToken)) || (await OAuthRefreshTokens.findOneByRefreshToken(refreshToken));

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
			// Keep compatibility with old collection
			// Deprecated: Remove on next major within a migration
			refreshTokenExpiresAt: 'refreshTokenExpiresAt' in token ? token.refreshTokenExpiresAt : token.expires,
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
			await OAuthAccessTokens.deleteOne({ refreshToken: token.refreshToken });
			// Keep compatibility with old collection
			// Deprecated: Remove on next major within a migration
			await OAuthRefreshTokens.deleteOne({ refreshToken: token.refreshToken });
		}

		if (token.accessToken) {
			await OAuthAccessTokens.deleteOne({ accessToken: token.accessToken });
		}

		return true;
	}

	async revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
		if (this.debug === true) {
			console.log('[OAuth2Server]', `in revokeAuthorizationCode (code: ${code.authorizationCode})`);
		}
		await OAuthAuthCodes.deleteOne({ authCode: code.authorizationCode });
		return true;
	}
}
