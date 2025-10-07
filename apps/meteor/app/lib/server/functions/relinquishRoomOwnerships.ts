import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, ReadReceipts, Team } from '@rocket.chat/models';

import type { SubscribedRoomsForUserWithDetails } from './getRoomsWithSingleOwner';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { eraseTeam } from '../../../api/server/lib/eraseTeam';
import { FileUpload } from '../../../file-upload/server';
import { notifyOnSubscriptionChanged } from '../lib/notifyListener';

const bulkTeamCleanup = async (rids: IRoom['_id'][], userId: string) => {
	const rooms = await Rooms.findByIds(rids).toArray();

	const teamsToRemove = rooms.filter((room) => room.teamMain);
	const teamIds = teamsToRemove.map((room) => room.teamId).filter((teamId) => teamId !== undefined);
	const uniqueTeamIds = [...new Set(teamIds)];

	await Promise.all(
		uniqueTeamIds.map(async (teamId) => {
			if (!userId) {
				throw new Error('error-user-not-found');
			}

			const team = await Team.findOneById(teamId);
			if (!team) {
				throw new Error('error-team-not-found');
			}

			await eraseTeam(userId, team, []);
		}),
	);
};

const bulkRoomCleanUp = async (rids: string[], userId?: string) => {
	// no bulk deletion for files
	await Promise.all(rids.map((rid) => FileUpload.removeFilesByRoomId(rid)));

	await Promise.all([
		Subscriptions.removeByRoomIds(rids, {
			async onTrash(doc) {
				void notifyOnSubscriptionChanged(doc, 'removed');
			},
		}),
		Messages.removeByRoomIds(rids),
		ReadReceipts.removeByRoomIds(rids),
		...[userId && bulkTeamCleanup(rids, userId)],
	]);

	await Rooms.removeByIds(rids);
};

export const relinquishRoomOwnerships = async function (
	userId: string,
	subscribedRooms: SubscribedRoomsForUserWithDetails[],
	removeDirectMessages = true,
	deletedBy?: IUser['_id'],
): Promise<SubscribedRoomsForUserWithDetails[]> {
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

	await bulkRoomCleanUp(roomIdsToRemove, deletedBy);

	return subscribedRooms;
};
