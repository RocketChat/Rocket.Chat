import { Meteor } from 'meteor/meteor';

import { roomFiles } from '../lib/roomFiles';

Meteor.publish('roomFiles', function(rid, limit = 50) {
	console.warn('The publication "roomFiles" is deprecated and will be removed after version v3.0.0');
	return roomFiles(this, { rid, limit });
});
