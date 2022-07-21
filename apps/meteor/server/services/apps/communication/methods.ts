import { Meteor } from 'meteor/meteor';
import type { SettingValue } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization/server';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import type { AppServerOrchestrator } from '../orchestrator';

const waitToLoad = function (orch: AppServerOrchestrator): unknown {
	return new Promise<void>((resolve) => {
		const id = setInterval(() => {
			if (orch.isEnabled() && orch.isLoaded()) {
				clearInterval(id);
				resolve();
			}
		}, 100);
	});
};

const waitToUnload = function (orch: AppServerOrchestrator): unknown {
	return new Promise<void>((resolve) => {
		const id = setInterval(() => {
			if (!orch.isEnabled() && !orch.isLoaded()) {
				clearInterval(id);
				resolve();
			}
		}, 100);
	});
};

export class AppMethods {
	private orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;

		this.addMethods();
	}

	isEnabled(): SettingValue {
		return typeof this.orch !== 'undefined' && this.orch.isEnabled();
	}

	isLoaded(): boolean {
		return Boolean(typeof this.orch !== 'undefined' && this.orch.isEnabled() && this.orch.isLoaded());
	}

	private addMethods(): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const instance = this;

		Meteor.methods({
			'apps/is-enabled'() {
				return instance.isEnabled();
			},

			'apps/is-loaded'() {
				return instance.isLoaded();
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

				Promise.await(waitToLoad(instance.orch));
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

				Promise.await(waitToUnload(instance.orch));
			}),
		});
	}
}
