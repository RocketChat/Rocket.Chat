import { Meteor } from 'meteor/meteor';

export async function performOpenIDLogout(serviceName: string): Promise<void> {
	return new Promise((resolve, reject) => {
		Meteor.call('openid.performSingleLogout', serviceName, (error: Meteor.Error | undefined, result: string | null) => {
			if (error) {
				console.error('Failed to perform OpenID Single Logout:', error);
				reject(error);
				return;
			}

			if (result) {
				// Redirect to the IdP logout endpoint
				window.location.href = result;
			}

			resolve();
		});
	});
}
