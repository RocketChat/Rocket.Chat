import { FlowRouter } from 'meteor/kadira:flow-router';

import * as AppLayout from '../../../client/lib/appLayout';

FlowRouter.route('/snippet/:snippetId/:snippetName', {
	name: 'snippetView',
	action() {
		AppLayout.render('main', { center: 'snippetPage' });
	},
});
