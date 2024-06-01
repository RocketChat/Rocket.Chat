import { Federation, FederationEE } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { parse as urlParse } from 'node:url';
import { Authorization } from '@rocket.chat/core-services';

import { settings } from '../../../settings/server';

const federationTesterHost = process.env.FEDERATION_TESTER_HOST?.trim()?.replace(/\/$/, '') || 'https://federationtester.matrix.org';

function checkFederation(): Promise<boolean> {
	const url = urlParse(settings.get('Site_Url'));

	let domain = url.hostname;

	if (url.port) {
		domain += ":" + url.port;
	}

	return new Promise((resolve, reject) =>
		fetch(`${federationTesterHost}/api/federation-ok?server_name=${domain}`).then(response =>
			response.text()).then(text =>
				resolve(text === 'GOOD')).catch(reject));
}

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		checkFederationConfiguration(): {};
	}
}

Meteor.methods<ServerMethods>({
	async checkFederationConfiguration() {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'checkFederationConfiguration',
			});
		}

		if (!await Authorization.hasPermission(uid, 'view-privileged-setting')) {
			throw new Meteor.Error('error-not-allowed', 'Action not allowed', {
				method: 'checkFederationConfiguration',
			})
		}

		const errors: string[] = [];

		const successes: string[] = [];

		const service = License.hasValidLicense() ? FederationEE : Federation;

		try {
			if (!await checkFederation()) {
				errors.push('external reachability could not be verified');
				// throw new Meteor.Error('error-invalid-configuration',, { method: 'checkFederationConfiguration' });
			} else {
				successes.push('homeserver configuration looks good');
			}
		} catch (error) {
			errors.push(`failed to verify external reachability: ${String(error)}`);
		}

		try {
			const { duration_ms: duration } = await service.verifyConfiguration();
			successes.push(`appservice configuration looks good, total round trip time to homeserver ${duration}ms`);
		} catch (error) {
			errors.push(`failed to verify appservice configuration: ${String(error)}`);
		}

		if (errors.length) {
			if (successes.length) {
				const message = ['Configuration could only be partially verified'].concat(successes).concat(errors).join(', ');

				throw new Meteor.Error('error-invalid-configuration', message, { method: 'checkFederationConfiguration' });
			}

			throw new Meteor.Error('error-invalid-configuration', ['Invalid configuration'].concat(errors).join(', '), { method: 'checkFederationConfiguration' });
		}


		return {
			message: ['All configuration looks good'].concat(successes).join(', '),
		}
	}
})
