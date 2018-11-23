import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';

export default {
	async generateToken(ctx) {
		const { tokenName, uid } = ctx.params;

		if (!await ctx.call('autorization.hasPermission', { uid, permission: 'create-personal-access-tokens' })) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:generateToken' });
		}

		const token = Random.secret();
		const tokenExist = RocketChat.models.Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: uid,
			tokenName,
		});
		if (tokenExist) {
			throw new Meteor.Error('error-token-already-exists', 'A token with this name already exists', { method: 'personalAccessTokens:generateToken' });
		}

		RocketChat.models.Users.addPersonalAccessTokenToUser({
			userId: uid,
			loginTokenObject: {
				hashedToken: Accounts._hashLoginToken(token),
				type: 'personalAccessToken',
				createdAt: new Date(),
				lastTokenPart: token.slice(-6),
				name: tokenName,
			},
		});
		return token;
	},
};
