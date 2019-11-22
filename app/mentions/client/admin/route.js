import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { t } from '../../../utils';

FlowRouter.route('/admin/mention-groups', {
	name: 'admin-mention-groups',
	action() {
		return BlazeLayout.render('main', {
			center: 'mentionGroups',
			pageTitle: t('Mentions_Groups'),
		});
	},
});

FlowRouter.route('/admin/mention-group/:id?', {
	name: 'admin-mention-group',
	action(params) {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('Mentions_GroupConfiguration'),
			pageTemplate: 'mentionGroupSettings',
			params,
		});
	},
});
