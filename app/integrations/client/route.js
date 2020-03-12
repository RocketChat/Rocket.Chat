import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { t } from '../../utils';

const dynamic = () => import('./views');

FlowRouter.route('/admin/integrations', {
	name: 'admin-integrations',
	async action() {
		await dynamic();
		return BlazeLayout.render('main', {
			center: 'integrations',
			pageTitle: t('Integrations'),
		});
	},
});

FlowRouter.route('/admin/integrations/new', {
	name: 'admin-integrations-new',
	async action() {
		await dynamic();
		return BlazeLayout.render('main', {
			center: 'integrationsNew',
			pageTitle: t('Integration_New'),
		});
	},
});

FlowRouter.route('/admin/integrations/incoming/:id?', {
	name: 'admin-integrations-incoming',
	async action(params) {
		await dynamic();
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('Integration_Incoming_WebHook'),
			pageTemplate: 'integrationsIncoming',
			params,
		});
	},
});

FlowRouter.route('/admin/integrations/outgoing/:id?', {
	name: 'admin-integrations-outgoing',
	async action(params) {
		await dynamic();
		return BlazeLayout.render('main', {
			center: 'integrationsOutgoing',
			pageTitle: t('Integration_Outgoing_WebHook'),
			params,
		});
	},
});

FlowRouter.route('/admin/integrations/outgoing/:id?/history', {
	name: 'admin-integrations-outgoing-history',
	async action(params) {
		await dynamic();
		return BlazeLayout.render('main', {
			center: 'integrationsOutgoingHistory',
			pageTitle: t('Integration_Outgoing_WebHook_History'),
			params,
		});
	},
});

FlowRouter.route('/admin/integrations/additional/zapier', {
	name: 'admin-integrations-additional-zapier',
	async action() {
		await dynamic();
		BlazeLayout.render('main', {
			center: 'integrationsAdditionalZapier',
		});
	},
});
