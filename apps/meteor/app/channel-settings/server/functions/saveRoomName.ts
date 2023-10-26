import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Integrations, Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Document, UpdateResult } from 'mongodb';

import { callbacks } from '../../../../lib/callbacks';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { checkUsernameAvailability } from '../../../lib/server/functions/checkUsernameAvailability';
import { getValidRoomName } from '../../../utils/server/lib/getValidRoomName';

const updateFName = async (rid: string, displayName: string): Promise<(UpdateResult | Document)[]> => {
	return Promise.all([Rooms.setFnameById(rid, displayName), Subscriptions.updateFnameByRoomId(rid, displayName)]);
};

const updateRoomName = async (rid: string, displayName: string, slugifiedRoomName: string) => {
	// Check if the username is available
	if (!(await checkUsernameAvailability(slugifiedRoomName))) {
		throw new Meteor.Error('error-duplicate-handle', `A room, team or user with name '${slugifiedRoomName}' already exists`, {
			function: 'RocketChat.updateRoomName',
			handle: slugifiedRoomName,
		});
	}

	return Promise.all([
		Rooms.setNameById(rid, slugifiedRoomName, displayName),
		Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName),
	]);
};

export async function saveRoomName(
	rid: string,
	displayName: string | undefined,
	user: IUser,
	sendMessage = true,
): Promise<string | undefined> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomdisplayName',
		});
	}

	if (roomCoordinator.getRoomDirectives(room.t).preventRenaming()) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			function: 'RocketChat.saveRoomdisplayName',
		});
	}
	if (displayName === room.name) {
		return;
	}

	if (!displayName?.trim()) {
		return;
	}

	const slugifiedRoomName = await getValidRoomName(displayName, rid);
	const isDiscussion = Boolean(room?.prid);

	let update;

	if (isDiscussion || isRoomFederated(room)) {
		update = await updateFName(rid, displayName);
	} else {
		update = await updateRoomName(rid, displayName, slugifiedRoomName);
	}

	if (!update) {
		return;
	}

	room.name && (await Integrations.updateRoomName(room.name, slugifiedRoomName));
	if (sendMessage) {
		await Message.saveSystemMessage('r', rid, displayName, user);
	}
	await callbacks.run('afterRoomNameChange', { rid, name: displayName, oldName: room.name });
	return displayName;
}
