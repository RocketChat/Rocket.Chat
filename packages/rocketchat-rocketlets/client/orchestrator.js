import { RocketletWebsocketReceiver } from './communication';

class RocketletClientOrchestrator {
	constructor() {
		this.ws = new RocketletWebsocketReceiver(this);

		this._addAdminMenuOption();
	}

	getWsListener() {
		return this.ws;
	}

	_addAdminMenuOption() {
		RocketChat.AdminBox.addOption({
			href: 'rocketlets',
			i18nLabel: 'Rocketlets',
			permissionGranted() {
				return RocketChat.authz.hasAtLeastOnePermission(['manage-rocketlets']);
			}
		});
	}
}

Meteor.startup(function _rlClientOrch() {
	window.Rocketlets = new RocketletClientOrchestrator();
});

// Bah, this has to be done *before* `Meteor.startup`
FlowRouter.route('/admin/rocketlets', {
	name: 'rocketlets',
	action() {
		BlazeLayout.render('main', { center: 'rocketlets' });
	}
});
