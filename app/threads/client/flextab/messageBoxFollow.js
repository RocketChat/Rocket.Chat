import { Template } from 'meteor/templating';

import './messageBoxFollow.html';
import { call } from '../../../ui-utils/client';

Template.messageBoxFollow.events({
	'click .js-follow'() {
		const { tmid } = this;
		call('followMessage', { mid: tmid });
	},
});
