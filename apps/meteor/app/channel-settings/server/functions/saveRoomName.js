import { Meteor } from 'meteor/meteor';
import { Integrations } from '@rocket.chat/models';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { Rooms, Messages, Subscriptions } from '../../../models/server';
import { getValidRoomName } from '../../../utils/server';
import { callbacks } from '../../../../lib/callbacks';
import { checkUsernameAvailability } from '../../../lib/server/functions';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

const updateFName = (rid, displayName) => {
	return Rooms.setFnameById(rid, displayName) && Subscriptions.updateFnameByRoomId(rid, displayName);
};

const updateRoomName = (rid, displayName) => {
	const slugifiedRoomName = getValidRoomName(displayName, rid);

	// Check if the username is available
	if (!checkUsernameAvailability(slugifiedRoomName)) {
		throw new Meteor.Error('error-duplicate-handle', `A room, team or user with name '${slugifiedRoomName}' already exists`, {
			function: 'RocketChat.updateRoomName',
			handle: slugifiedRoomName,
		});
	}

	return (
		Rooms.setNameById(rid, slugifiedRoomName, displayName) && Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName)
	);
};

export async function saveRoomName(rid, displayName, user, sendMessage = true) {
	const room = Rooms.findOneById(rid);
	if (roomCoordinator.getRoomDirectives(room.t)?.preventRenaming()) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			function: 'RocketChat.saveRoomdisplayName',
		});
	}
	if (displayName === room.name) {
		return;
	}
	const isDiscussion = Boolean(room && room.prid);
	let update;

	if (isDiscussion || isRoomFederated(room)) {
		update = updateFName(rid, displayName);
	} else {
		update = updateRoomName(rid, displayName);
	}

	if (!update) {
		return;
	}

	await Integrations.updateRoomName(room.name, displayName);
	if (sendMessage) {
		Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
	}
	callbacks.run('afterRoomNameChange', { rid, name: displayName, oldName: room.name });
	return displayName;
}
