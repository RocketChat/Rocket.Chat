import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings';
import { checkWaitingQueue } from './lib/Helper';
import './lib/query.helper';

Meteor.startup(function() {
	settings.onload('Livechat_maximum_chats_per_agent', function(/* key, value */) {
		checkWaitingQueue();
	});
});
