import { AppEvents } from '../communication';
const ENABLED_STATUS = ['auto_enabled', 'manually_enabled'];
const enabled = ({status}) => ENABLED_STATUS.includes(status);
const sortByStatus = (a, b) => {
	if (enabled(a)) {
		if (enabled(b)) {
			return a.name > b.name;
		}
		return -1;
	}
	return 1;
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
		const instance = Template.instance();
		const filter = instance.filter.get().toLowerCase();
		return instance.apps.get().filter(({name}) => name.toLowerCase().includes(filter)).sort(sortByStatus);
	},
	parseStatus(status) {
		return t(`App_status_${ status }`);
	},
	activeClass(status) {
		return enabled({status}) ? 'active' : '';
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
