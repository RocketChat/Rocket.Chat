import { Template } from 'meteor/templating';

import './messageBoxFollow.html';
import { call } from '../../../ui-utils/client';

Template.messageBoxFollow.events({
	'click .js-follow'() {
		const { tmid, taskRoomId } = this;
		!taskRoomId ? call('followMessage', { mid: tmid }) : call('followTask', { mid: tmid });
	},
});
