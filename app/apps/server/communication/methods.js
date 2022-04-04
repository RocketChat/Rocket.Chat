import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization/server';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';

const waitToLoad = function (orch) {
	return new Promise((resolve) => {
		let id = setInterval(() => {
			if (orch.isEnabled() && orch.isLoaded()) {
				clearInterval(id);
				id = -1;
				resolve();
			}
		}, 100);
	});
};

const waitToUnload = function (orch) {
	return new Promise((resolve) => {
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
	constructor(orch) {
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

		Meteor.methods({
			'apps/is-enabled'() {
				return instance.isEnabled();
			},

			'apps/is-loaded'() {
				return instance.isLoaded();
			},

			'apps/go-enable': twoFactorRequired(function _appsGoEnable() {
				if (!Meteor.userId()) {
					throw new Meteor.Error('error-invalid-user', 'Invalid user', {
						method: 'apps/go-enable',
					});
				}

				if (!hasPermission(Meteor.userId(), 'manage-apps')) {
					throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
						method: 'apps/go-enable',
					});
				}

				Settings.updateValueById('Apps_Framework_enabled', true);

				Promise.await(waitToLoad(instance._orch));
			}),

			'apps/go-disable': twoFactorRequired(function _appsGoDisable() {
				if (!Meteor.userId()) {
					throw new Meteor.Error('error-invalid-user', 'Invalid user', {
						method: 'apps/go-enable',
					});
				}

				if (!hasPermission(Meteor.userId(), 'manage-apps')) {
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
