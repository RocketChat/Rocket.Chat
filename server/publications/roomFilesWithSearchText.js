import { roomFiles } from '../lib/roomFiles';

Meteor.publish('roomFilesWithSearchText', function(rid, searchText, limit = 50) {
	return roomFiles(this, { rid, searchText, limit });
});
