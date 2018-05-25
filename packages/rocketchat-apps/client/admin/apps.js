import { AppEvents } from '../communication';

const sortByStatus = (a, b) => {
	if (a.status === 'auto_enabled' || a.status === 'manually_enabled') {
		if (b.status === 'auto_enabled' || b.status === 'manually_enabled') {
			return a.name > b.name;
		} else {
			return -1;
		}
	} else {
		return 1;
	}
};

Template.apps.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.apps = new ReactiveVar([]);
	this.filter = new ReactiveVar('');

	RocketChat.API.get('apps').then((result) => {
		instance.apps.set(result.apps);
		instance.ready.set(true);
	});

	instance.onAppAdded = function _appOnAppAdded(appId) {
		RocketChat.API.get(`apps/${ appId }`).then((result) => {
			const apps = instance.apps.get();
			apps.push(result.app);
			instance.apps.set(apps);
		});
	};

	instance.onAppRemoved = function _appOnAppRemoved(appId) {
		const apps = instance.apps.get();

		let index = -1;
		apps.find((item, i) => {
			if (item.id === appId) {
				index = i;
				return true;
			}
		});

		apps.splice(index, 1);
		instance.apps.set(apps);
	};

	window.Apps.getWsListener().registerListener(AppEvents.APP_ADDED, instance.onAppAdded);
	window.Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, instance.onAppAdded);
});

Template.apps.onDestroyed(function() {
	const instance = this;

	window.Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, instance.onAppAdded);
	window.Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, instance.onAppAdded);
});

Template.apps.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}

		return false;
	},
	apps() {
		return Template.instance().apps.get().sort(sortByStatus).filter(({name}) => name.toLowerCase().includes(Template.instance().filter.get().toLowerCase()));
	},
	parseStatus(status) {
		return t(`App_status_${ status }`);
	},
	activeClass(status) {
		return status === 'auto_enabled' || status === 'manually_enabled'? 'active' : '';
	}
});

Template.apps.events({
	'click .manage'() {
		const rl = this;

		if (rl && rl.id) {
			FlowRouter.go(`/admin/apps/${ rl.id }`);
		} else {
			// show an error ? I don't think this should ever happen
		}
	},
	'click [data-button="install"]'() {
		FlowRouter.go('/admin/app/install');
	},
	'keyup #app-filter'(e, t) {
		t.filter.set(e.currentTarget.value);
	}
});
