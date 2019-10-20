import { Meteor } from 'meteor/meteor';

import { roomFiles } from '../lib/roomFiles';

console.warn('The publication "roomFilesWithSearchText" is deprecated and will be removed after version v3.0.0');
Meteor.publish('roomFilesWithSearchText', function(rid, searchText, limit = 50) {
	return roomFiles(this, { rid, searchText, limit });
});
