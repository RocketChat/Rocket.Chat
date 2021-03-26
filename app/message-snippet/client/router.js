import { FlowRouter } from 'meteor/kadira:flow-router';

import * as BlazeLayout from '../../../client/lib/portals/blazeLayout';

FlowRouter.route('/snippet/:snippetId/:snippetName', {
	name: 'snippetView',
	action() {
		BlazeLayout.render('main', { center: 'snippetPage' });
	},
});
