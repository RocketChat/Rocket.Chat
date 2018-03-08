export class AppMethods {
	constructor(manager) {
		this._manager = manager;

		this._addMethods();
	}

	_addMethods() {
		const manager = this._manager;

		Meteor.methods({
			'apps/is-enabled'() {
				return typeof manager !== 'undefined';
			},

			'apps/is-loaded'() {
				return typeof manager !== 'undefined' || manager.areAppsLoaded();
			}
		});
	}
}
