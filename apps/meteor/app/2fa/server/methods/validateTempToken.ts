import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { notifyOnUserChange, notifyOnUserChangeAsync } from '../../../lib/server/lib/notifyListener';
import { TOTP } from '../lib/totp';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:validateTempToken': (userToken: string) => { codes: string[] } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:validateTempToken'(userToken) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		const user = await Meteor.userAsync();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:validateTempToken',
			});
		}

		if (!user.services?.totp?.tempSecret) {
			throw new Meteor.Error('invalid-totp');
		}

		const verified = await TOTP.verify({
			secret: user.services.totp.tempSecret,
			token: userToken,
		});
		if (!verified) {
			throw new Meteor.Error('invalid-totp');
		}

		const { codes, hashedCodes } = TOTP.generateCodes();

		await Users.enable2FAAndSetSecretAndCodesByUserId(userId, user.services.totp.tempSecret, hashedCodes);

		// Once the TOTP is validated we logout all other clients
		const { 'x-auth-token': xAuthToken } = this.connection?.httpHeaders ?? {};
		if (xAuthToken && this.userId) {
			const hashedToken = Accounts._hashLoginToken(xAuthToken);

			const { modifiedCount } = await Users.removeNonPATLoginTokensExcept(this.userId, hashedToken);

			if (modifiedCount > 0) {
				// TODO this can be optmized so places that care about loginTokens being removed are invoked directly
				// instead of having to listen to every watch.users event
				void notifyOnUserChangeAsync(async () => {
					if (!this.userId) {
						return;
					}
					const user = await Users.findOneById(this.userId, { projection: { 'services.resume.loginTokens': 1, 'services.totp': 1 } });
					return {
						clientAction: 'updated',
						id: this.userId,
						diff: {
							'services.resume.loginTokens': user?.services?.resume?.loginTokens,
							...(user?.services?.totp && { 'services.totp.enabled': user.services.totp.enabled }),
						},
					};
				});
			} else {
				void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff: { 'services.totp.enabled': true } });
			}
		}

		return { codes };
	},
});
