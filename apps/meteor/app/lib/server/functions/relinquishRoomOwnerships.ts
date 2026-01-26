import type { IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, ReadReceipts, Team } from '@rocket.chat/models';

import type { SubscribedRoomsForUserWithDetails } from './getRoomsWithSingleOwner';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { eraseRoomLooseValidation, eraseTeamOnRelinquishRoomOwnerships } from '../../../api/server/lib/eraseTeam';
import { FileUpload } from '../../../file-upload/server';
import { notifyOnSubscriptionChanged } from '../lib/notifyListener';

const bulkTeamCleanup = async (rids: IRoom['_id'][]) => {
	const rooms = (await Rooms.findByIds(rids, { projection: { teamId: 1, teamMain: 1 } }).toArray()) as Pick<
		IRoom,
		'_id' | 'teamId' | 'teamMain'
	>[];

	const teamsToRemove = rooms.filter((room) => room.teamMain);
	const teamIds = teamsToRemove.map((room) => room.teamId).filter((teamId) => teamId !== undefined);
	const uniqueTeamIds = [...new Set(teamIds)];

	const deletedRoomIds: string[] = [];
	await Promise.all(
		uniqueTeamIds.map(async (teamId) => {
			const team = await Team.findOneById(teamId);
			if (!team) {
				return;
			}

			const ids = await eraseTeamOnRelinquishRoomOwnerships(team, []);
			ids.forEach((id) => deletedRoomIds.push(id));
		}),
	);
	return deletedRoomIds;
};

const bulkRoomCleanUp = async (rids: string[]) => {
	// no bulk deletion for files
	await Promise.all(rids.map((rid) => FileUpload.removeFilesByRoomId(rid)));

	const [, , , deletedRoomIds] = await Promise.all([
		Subscriptions.removeByRoomIds(rids, {
			async onTrash(doc) {
				void notifyOnSubscriptionChanged(doc, 'removed');
			},
		}),
		Messages.removeByRoomIds(rids),
		ReadReceipts.removeByRoomIds(rids),
		bulkTeamCleanup(rids),
	]);

	const restRidsToRemove = rids.filter((rid) => !deletedRoomIds.includes(rid));
	await Promise.all(
		restRidsToRemove.map(async (rid) => {
			const isDeleted = await eraseRoomLooseValidation(rid);
			if (isDeleted) {
				deletedRoomIds.push(rid);
			}
		}),
	);

	return deletedRoomIds;
};

export const relinquishRoomOwnerships = async function (
	userId: string,
	subscribedRooms: SubscribedRoomsForUserWithDetails[],
	removeDirectMessages = true,
) {
	// change owners
	const changeOwner = subscribedRooms.filter(({ shouldChangeOwner }) => shouldChangeOwner);

	for await (const { newOwner, rid } of changeOwner) {
		newOwner && (await addUserRolesAsync(newOwner, ['owner'], rid));
	}

	const roomIdsToRemove: string[] = subscribedRooms.filter(({ shouldBeRemoved }) => shouldBeRemoved).map(({ rid }) => rid);

	if (removeDirectMessages) {
		(await Rooms.find1On1ByUserId(userId, { projection: { _id: 1 } }).toArray()).map(({ _id }: { _id: string }) =>
			roomIdsToRemove.push(_id),
		);
	}

	return bulkRoomCleanUp(roomIdsToRemove);
};
