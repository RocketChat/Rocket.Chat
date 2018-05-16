import { AppWebsocketReceiver } from './communication';

class AppClientOrchestrator {
	constructor() {
		this.ws = new AppWebsocketReceiver(this);

		this._addAdminMenuOption();

		Meteor.defer(() => this._loadLanguages());
	}

	getWsListener() {
		return this.ws;
	}

	_addAdminMenuOption() {
		RocketChat.AdminBox.addOption({
			icon: 'cube',
			href: 'apps',
			i18nLabel: 'Apps',
			permissionGranted() {
				return RocketChat.authz.hasAtLeastOnePermission(['manage-apps']);
			}
		});
	}

	_loadLanguages() {
		RocketChat.API.get('apps/languages').then((info) => {
			info.apps.forEach((rlInfo) => this.parseAndLoadLanguages(rlInfo.languages));
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
	Meteor.call('apps/is-enabled', (error, e) => e ? window.Apps = new AppClientOrchestrator() : undefined);
});

// Bah, this has to be done *before* `Meteor.startup`
FlowRouter.route('/admin/apps', {
	name: 'apps',
	action() {
		BlazeLayout.render('main', { center: 'apps' });
	}
});

FlowRouter.route('/admin/app/install', {
	name: 'app-install',
	action() {
		BlazeLayout.render('main', { center: 'appInstall' });
	}
});

FlowRouter.route('/admin/apps/:appId', {
	name: 'app-manage',
	action() {
		BlazeLayout.render('main', { center: 'appManage' });
	}
});

FlowRouter.route('/admin/apps/:appId/logs', {
	name: 'app-logs',
	action() {
		BlazeLayout.render('main', { center: 'appLogs' });
	}
});
