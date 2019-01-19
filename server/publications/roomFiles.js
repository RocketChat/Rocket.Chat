import { Meteor } from 'meteor/meteor';
import { roomFiles } from '../lib/roomFiles';

Meteor.publish('roomFiles', function(rid, limit = 50) {
	return roomFiles(this, { rid, limit });
});
