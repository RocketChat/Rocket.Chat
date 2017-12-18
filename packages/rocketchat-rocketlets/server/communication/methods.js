export class RocketletMethods {
	constructor(manager) {
		this._manager = manager;

		this._addMethods();
	}

	_addMethods() {
		const manager = this._manager;

		Meteor.methods({
			'rocketlets/is-enabled'() {
				return typeof manager !== 'undefined';
			},

			'rocketlets/is-loaded'() {
				return typeof manager !== 'undefined' || manager.areRocketletsLoaded();
			}
		});
	}
}
