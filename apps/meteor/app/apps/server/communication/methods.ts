import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization/server';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { AppServerOrchestrator } from '../orchestrator';

const waitToLoad = function (orch: AppServerOrchestrator) {
	return new Promise<void>((resolve) => {
		let id = setInterval(() => {
			if (orch.isEnabled() && orch.isLoaded()) {
				clearInterval(id);
				id = -1;
				resolve();
			}
		}, 100);
	});
};

const waitToUnload = function (orch: AppServerOrchestrator) {
	return new Promise<void>((resolve) => {
		let id = setInterval(() => {
			if (!orch.isEnabled() && !orch.isLoaded()) {
				clearInterval(id);
				id = -1;
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

	isEnabled() {
		return typeof this._orch !== 'undefined' && this._orch.isEnabled();
	}

	isLoaded() {
		return typeof this._orch !== 'undefined' && this._orch.isEnabled() && this._orch.isLoaded();
	}

	_addMethods() {
		const instance = this;
		const uid = Meteor.userId();
		
		Meteor.methods({
			'apps/is-enabled'() {
				return instance.isEnabled();
			},

			'apps/is-loaded'() {
				return instance.isLoaded();
			},

			'apps/go-enable': twoFactorRequired(function _appsGoEnable() {
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
