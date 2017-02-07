FlowRouter.route('/admin/integrations', {
	name: 'admin-integrations',
	subscriptions() {
		this.register('integrations', Meteor.subscribe('integrations'));
	},
	action() {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('Integrations'),
			pageTemplate: 'integrations'
		});
	}
});

FlowRouter.route('/admin/integrations/new', {
	name: 'admin-integrations-new',
	subscriptions() {
		this.register('integrations', Meteor.subscribe('integrations'));
	},
	action() {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('Integration_New'),
			pageTemplate: 'integrationsNew'
		});
	}
});

FlowRouter.route('/admin/integrations/incoming/:id?', {
	name: 'admin-integrations-incoming',
	subscriptions() {
		this.register('integrations', Meteor.subscribe('integrations'));
	},
	action(params) {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('Integration_Incoming_WebHook'),
			pageTemplate: 'integrationsIncoming',
			params
		});
	}
});

FlowRouter.route('/admin/integrations/outgoing/:id?', {
	name: 'admin-integrations-outgoing',
	subscriptions(params) {
		this.register('integrations', Meteor.subscribe('integrations'));

		if (params.id) {
			this.register('integrationHistory', Meteor.subscribe('integrationHistory', params.id));
		}
	},
	action(params) {
		return BlazeLayout.render('main', {
			center: 'integrationsOutgoing',
			pageTitle: t('Integration_Outgoing_WebHook'),
			params
		});
	}
});

FlowRouter.route('/admin/integrations/outgoing/:id?/history', {
	name: 'admin-integrations-outgoing-history',
	subscriptions(params) {
		this.register('integrations', Meteor.subscribe('integrations'));

		if (params.id) {
			this.register('integrationHistory', Meteor.subscribe('integrationHistory', params.id));
		}
	},
	action(params) {
		return BlazeLayout.render('main', {
			center: 'integrationsOutgoingHistory',
			pageTitle: t('Integration_Outgoing_WebHook_History'),
			params
		});
	}
});
