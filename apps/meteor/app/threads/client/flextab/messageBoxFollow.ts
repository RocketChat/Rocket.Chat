import { Template } from 'meteor/templating';

import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import './messageBoxFollow.html';

Template.messageBoxFollow.events({
	'click .js-follow'(this: { tmid: string }) {
		const { tmid } = this;
		callWithErrorHandling('followMessage', { mid: tmid });
	},
});
