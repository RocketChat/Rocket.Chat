import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../ui-admin/client/routes';
import { t } from '../../utils';

const dynamic = () => import('./views');

routes.route('/integrations', {
	name: 'admin-integrations',
	async action() {
		await dynamic();
		return BlazeLayout.render('main', {
			center: 'integrations',
			pageTitle: t('Integrations'),
		});
	},
});

routes.route('/integrations/new', {
	name: 'admin-integrations-new',
	async action() {
		await dynamic();
		return BlazeLayout.render('main', {
			center: 'integrationsNew',
			pageTitle: t('Integration_New'),
		});
	},
});

routes.route('/integrations/incoming/:id?', {
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

routes.route('/integrations/outgoing/:id?', {
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

routes.route('/integrations/outgoing/:id?/history', {
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

routes.route('/integrations/additional/zapier', {
	name: 'admin-integrations-additional-zapier',
	async action() {
		await dynamic();
		BlazeLayout.render('main', {
			center: 'integrationsAdditionalZapier',
		});
	},
});
