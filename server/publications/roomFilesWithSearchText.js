import { Meteor } from 'meteor/meteor';

import { roomFiles } from '../lib/roomFiles';

Meteor.publish('roomFilesWithSearchText', function(rid, searchText, limit = 50) {
	console.warn('The publication "roomFilesWithSearchText" is deprecated and will be removed after version v3.0.0');
	return roomFiles(this, { rid, searchText, limit });
});
