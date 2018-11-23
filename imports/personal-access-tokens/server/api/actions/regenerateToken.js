import { Meteor } from 'meteor/meteor';

export default {
	async regenerateToken(ctx) {
		const { tokenName, uid } = ctx.params;

		if (!await ctx.call('autorization.hasPermission', { uid, permission:'create-personal-access-tokens' })) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:regenerateToken' });
		}

		const tokenExist = RocketChat.models.Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: uid,
			tokenName,
		});

		if (!tokenExist) {
			throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', { method: 'personalAccessTokens:regenerateToken' });
		}

		await RocketChat.Services.call('personalAccessTokens.removeToken', { tokenName, uid });
		return RocketChat.Services.call('personalAccessTokens.generateToken', { tokenName, uid });
	},
};
