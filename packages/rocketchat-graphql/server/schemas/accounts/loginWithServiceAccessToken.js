import AccountsServer from '../../mocks/accounts/server';

export const schema = `
	type Mutation {
		loginWithServiceAccessToken(service: String!, accessToken: String!): LoginResult
	}
`;

export const resolver = {
	Mutation: {
		loginWithServiceAccessToken: async(root, { service, accessToken }) => {
			try {
				const userData = await oauthResolver.getUserDataFromService(accessToken, service);
				const accountsServer = AccountsServer;
				const user = await oauthResolver.getUserFromServiceUserData(service, userData);

				if (!user) {
					return null;
				}

				const loginResult = await accountsServer.loginWithUser(user);

				return {
					refreshToken: loginResult.tokens.refreshToken,
					accessToken: loginResult.tokens.accessToken
				};
			} catch (e) {
				console.error('Failed to login with service', e);
			}
		}
	}
};
