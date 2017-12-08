import { RocketletWebsocketReceiver } from './communication';

class RocketletClientOrchestrator {
	constructor() {
		this.ws = new RocketletWebsocketReceiver(this);

		this._addAdminMenuOption();

		const loadLangs = setInterval(() => {
			if (Meteor.user()) {
				clearInterval(loadLangs);
				this._loadLanguages();
			}
		}, 50);
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

	_loadLanguages() {
		if (!Meteor.user()) {
			return;
		}

		RocketChat.API.get('rocketlets?languagesOnly=true').then((info) => {
			info.rocketlets.forEach((rlInfo) => this.parseAndLoadLanguages(rlInfo.languages));
		});
	}

	parseAndLoadLanguages(languages) {
		Object.keys(languages).forEach((key) => {
			try {
				TAPi18next.addResourceBundle(key, 'project', languages[key]);
			} catch (e) {
				// Failed to parse the json
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

FlowRouter.route('/admin/rocketlet/install', {
	name: 'rocketlet-install',
	action() {
		BlazeLayout.render('main', { center: 'rocketletInstall' });
	}
});

FlowRouter.route('/admin/rocketlets/:rocketletId', {
	name: 'rocketlet-manage',
	action() {
		BlazeLayout.render('main', { center: 'rocketletManage' });
	}
});
