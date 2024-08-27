import { Message, Room } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Integrations, Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Document, UpdateResult } from 'mongodb';

import { callbacks } from '../../../../lib/callbacks';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { checkUsernameAvailability } from '../../../lib/server/functions/checkUsernameAvailability';
import { notifyOnIntegrationChangedByChannels, notifyOnSubscriptionChangedByRoomId } from '../../../lib/server/lib/notifyListener';
import { getValidRoomName } from '../../../utils/server/lib/getValidRoomName';

const updateFName = async (rid: string, displayName: string): Promise<(UpdateResult | Document)[]> => {
	const responses = await Promise.all([Rooms.setFnameById(rid, displayName), Subscriptions.updateFnameByRoomId(rid, displayName)]);

	if (responses[1]?.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	return responses;
};

const updateRoomName = async (rid: string, displayName: string, slugifiedRoomName: string) => {
	// Check if the username is available
	if (!(await checkUsernameAvailability(slugifiedRoomName))) {
		throw new Meteor.Error('error-duplicate-handle', `A room, team or user with name '${slugifiedRoomName}' already exists`, {
			function: 'RocketChat.updateRoomName',
			handle: slugifiedRoomName,
		});
	}

	const responses = await Promise.all([
		Rooms.setNameById(rid, slugifiedRoomName, displayName),
		Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName),
	]);

	if (responses[1]?.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	return responses;
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

	await Room.beforeNameChange(room);

	if (displayName === room.name) {
		return;
	}

	if (!displayName?.trim()) {
		return;
	}

	const isDiscussion = Boolean(room?.prid);

	const slugifiedRoomName = isDiscussion ? displayName : await getValidRoomName(displayName, rid);

	let update;

	if (isDiscussion || isRoomFederated(room)) {
		update = await updateFName(rid, displayName);
	} else {
		update = await updateRoomName(rid, displayName, slugifiedRoomName);
	}

	if (!update) {
		return;
	}

	if (room.name && !isDiscussion) {
		await Integrations.updateRoomName(room.name, slugifiedRoomName);
		void notifyOnIntegrationChangedByChannels([slugifiedRoomName]);
	}

	if (sendMessage) {
		await Message.saveSystemMessage('r', rid, displayName, user);
	}

	await callbacks.run('afterRoomNameChange', { rid, name: displayName, oldName: room.name });
	return displayName;
}
