import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../app/authorization';
import { settings } from '../../../../app/settings';

export const cannedResponsesStreamer = new Meteor.Streamer('canned-responses');

cannedResponsesStreamer.allowWrite('none');
cannedResponsesStreamer.allowRead(function() {
	return this.userId && settings.get('Canned_Responses_Enable') && hasPermission(this.userId, 'view-canned-responses');
});
