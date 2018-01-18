Template.appLogs.onCreated(function() {
	const instance = this;
	this.id = new ReactiveVar(FlowRouter.getParam('appId'));
	this.ready = new ReactiveVar(false);
	this.app = new ReactiveVar({});
	this.logs = new ReactiveVar([]);

	const id = this.id.get();
	const got = { info: false, logs: false };

	RocketChat.API.get(`apps/${ id }`).then((result) => {
		instance.app.set(result.app);

		got.info = true;
		if (got.info && got.logs) {
			this.ready.set(true);
		}
	});

	RocketChat.API.get(`apps/${ id }/logs`).then((result) => {
		console.log('logs result:', result);

		instance.logs.set(result.logs);

		got.logs = true;
		if (got.info && got.logs) {
			this.ready.set(true);
		}
	});
});

Template.appLogs.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}

		return false;
	},
	app() {
		return Template.instance().app.get();
	},
	logs() {
		return Template.instance().logs.get();
	}
});

Template.appLogs.events({
	'click .expand': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
	},

	'click .collapse': (e) => {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	}
});
