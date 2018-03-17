export class AppMethods {
	constructor(manager) {
		this._manager = manager;

		this._addMethods();
	}

	isEnabled() {
		return typeof this._manager !== 'undefined';
	}

	isLoaded() {
		return typeof this._manager !== 'undefined' && this.manager.areAppsLoaded();
	}

	_addMethods() {
		const instance = this;

		Meteor.methods({
			'apps/is-enabled'() {
				return instance.isEnabled();
			},

			'apps/is-loaded'() {
				return instance.isLoaded();
			}
		});
	}
}
