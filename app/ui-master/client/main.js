import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { settings } from '../../settings';
import { isLayoutEmbedded } from '../../../client/lib/utils/isLayoutEmbedded';
import './main.html';

Template.main.helpers({
	removeSidenav: () => isLayoutEmbedded() && !/^\/admin/.test(FlowRouter.current().route.path),
	embeddedVersion: () => {
		if (isLayoutEmbedded()) {
			return 'embedded-view';
		}
	},
	readReceiptsEnabled: () => {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			return 'read-receipts-enabled';
		}
	},
});
