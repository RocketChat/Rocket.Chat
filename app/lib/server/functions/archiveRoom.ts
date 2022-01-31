import { Meteor } from 'meteor/meteor';

import { Rooms, Subscriptions } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const archiveRoom = function (rid: string) {
	Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);

	callbacks.run('afterRoomArchived', Rooms.findOneById(rid), Meteor.user());
};
