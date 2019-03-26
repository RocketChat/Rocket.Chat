import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks/server';
import { Messages } from '../../../models/server';
import { settings } from '../../settings';

Meteor.startup(function() {

	const fn = function(message) {
		if (message.tmid) {
			Messages.refreshThreadMetadata({ tmid: message.tmid }, message);
		}
		return message;
	};

	settings.get('Threads_enabled', function(key, value) {
		if (value) {
			return callbacks.add('afterSaveMessage', fn, callbacks.priority.LOW, 'Threads');
		}
		callbacks.remove('afterSaveMessage', 'Threads');
	});

});



// callbacks.add('afterDeleteMessage', function (message, { _id, prid } = {}) {
// 	if (prid) {
// 		Messages.refreshDiscussionMetadata({ rid: _id }, message);
// 	}
// 	if (message.drid) {
// 		deleteRoom(message.drid);
// 	}
// 	return message;
// }, callbacks.priority.LOW, 'PropagateDiscussionMetadata');

// callbacks.add('afterDeleteRoom', function (rid) {
// 	Rooms.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id));
// }, 'DeleteDiscussionChain');
