import { Meteor } from 'meteor/meteor';
import { SettingValue } from '@rocket.chat/core-typings';

import { Settings } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization/server';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { AppServerOrchestrator } from '../orchestrator';

const waitToLoad = function (orch: AppServerOrchestrator): unknown {
	return new Promise<void>((resolve) => {
		let id = setInterval(() => {
			if (orch.isEnabled() && orch.isLoaded()) {
				clearInterval(id);
				id = -1 as unknown as NodeJS.Timeout;
				resolve();
			}
		}, 100);
	});
};

const waitToUnload = function (orch: AppServerOrchestrator): unknown {
	return new Promise<void>((resolve) => {
		let id = setInterval(() => {
			if (!orch.isEnabled() && !orch.isLoaded()) {
				clearInterval(id);
				id = -1 as unknown as NodeJS.Timeout;
				resolve();
			}
		}, 100);
	});
};

export class AppMethods {
	_orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this._orch = orch;

		this._addMethods();
	}

	isEnabled(): SettingValue {
		return typeof this._orch !== 'undefined' && this._orch.isEnabled();
	}

	isLoaded(): boolean{
		return Boolean(typeof this._orch !== 'undefined' && this._orch.isEnabled() && this._orch.isLoaded());
	}

	_addMethods(): void {
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

				Promise.await(waitToLoad(instance._orch));
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

				Promise.await(waitToUnload(instance._orch));
			}),
		});
	}
}
