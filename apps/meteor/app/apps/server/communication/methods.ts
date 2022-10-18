import { Meteor } from 'meteor/meteor';
import { Settings } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization/server';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { Apps } from '../../../../server/sdk';

const waitToLoad = async function (): Promise<unknown> {
	const isEnabled = await Apps.isEnabled();
	const isLoaded = await Apps.isLoaded();
	return new Promise<void>((resolve) => {
		const id = setInterval(async () => {
			if (isEnabled && isLoaded) {
				clearInterval(id);
				resolve();
			}
		}, 100);
	});
};

const waitToUnload = async function (): Promise<unknown> {
	const isEnabled = await Apps.isEnabled();
	const isLoaded = await Apps.isLoaded();
	return new Promise<void>((resolve) => {
		const id = setInterval(() => {
			if (!isEnabled && !isLoaded) {
				clearInterval(id);
				resolve();
			}
		}, 100);
	});
};

export class AppMethods {
	constructor() {
		this.addMethods();
	}

	private addMethods(): void {
		Meteor.methods({
			'apps/is-enabled'() {
				return Apps.isEnabled();
			},

			'apps/is-loaded'() {
				return Apps.isLoaded();
			},

			'apps/go-enable': twoFactorRequired(function _appsGoEnable() {
				const uid = Meteor.userId();
				if (!uid) {
					throw new Meteor.Error('error-invalid-user', 'Invalid user', {
						method: 'apps/go-enable',
					});
				}

				if (!hasPermission(uid, 'manage-apps')) {
					throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
						method: 'apps/go-enable',
					});
				}

				Settings.updateValueById('Apps_Framework_enabled', true);

				Promise.await(waitToLoad());
			}),

			'apps/go-disable': twoFactorRequired(function _appsGoDisable() {
				const uid = Meteor.userId();
				if (!uid) {
					throw new Meteor.Error('error-invalid-user', 'Invalid user', {
						method: 'apps/go-enable',
					});
				}

				if (!hasPermission(uid, 'manage-apps')) {
					throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
						method: 'apps/go-enable',
					});
				}

				Settings.updateValueById('Apps_Framework_enabled', false);

				Promise.await(waitToUnload());
			}),
		});
	}
}
