import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';

export const screenSharingStreamer = new Meteor.Streamer('screen-sharing');

screenSharingStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});
screenSharingStreamer.allowEmit('all');
screenSharingStreamer.allowWrite('all');
