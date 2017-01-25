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
			params: params
		});
	}
});

FlowRouter.route('/admin/integrations/outgoing/:id?', {
	name: 'admin-integrations-outgoing',
	subscriptions() {
		this.register('integrations', Meteor.subscribe('integrations'));
	},
	action(params) {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('Integration_Outgoing_WebHook'),
			pageTemplate: 'integrationsOutgoing',
			params: params
		});
	}
});
