import { Reports, Rooms, Users } from '@rocket.chat/models';
import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { addMigration } from '../../lib/migrations';
import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';

addMigration({
	version: 283,
	async up() {
		upsertPermissions();

		const defaultRoom = (_id: string): Pick<IRoom, '_id' | 'name' | 't'> => {
			return {
				_id,
				name: 'ghost-room',
				t: 'd',
			};
		};

		const getRoomFields = (room: IRoom) => {
			const { _id, name, t, federated, fname, prid } = room;
			return {
				_id,
				name,
				t,
				federated,
				fname,
				prid,
			};
		};

		const getUserFields = (user: IUser): Pick<IUser, '_id' | 'username' | 'avatarETag' | 'active' | 'name' | 'createdAt'> => {
			const { _id, username, name, avatarETag, active, createdAt } = user;
			return {
				_id,
				username,
				name,
				avatarETag,
				active,
				createdAt,
			};
		};

		const defaultUser = (_id: string): Pick<IUser, '_id' | 'username' | 'avatarETag' | 'active' | 'name' | 'createdAt'> => {
			return {
				_id,
				username: 'rocket.cat',
				name: 'Ghost User',
				avatarETag: undefined,
				active: false,
				createdAt: new Date(),
			};
		};
		// get all the distinct rooms

		const rooms = await Reports.getDistinctRooms();

		rooms.forEach(async (ridDoc: { _id: string }) => {
			const { _id: rid } = ridDoc;
			const roomData = await Rooms.findOneById(rid);

			const room = roomData ? getRoomFields(roomData) : defaultRoom(rid);

			try {
				await Reports.updateMany(
					{
						'message.rid': rid,
					},
					{ $set: { room } },
				);
			} catch (error) {
				console.error('Error while migrating the room', error);
			}
		});

		// get all the distinct users

		const users = await Reports.getDistinctUsers();

		users.forEach(async (userDoc: { _id: string }) => {
			const { _id: userId } = userDoc;
			const userData = await Users.findOne({ _id: userId });

			const user = userData ? getUserFields(userData) : defaultUser(userId);

			try {
				await Reports.updateMany(
					{
						userId,
					},
					{ $set: { reportedBy: user }, $unset: { userId: 1 } },
				);
			} catch (error) {
				console.error('Error while migrating the user', error);
			}
		});
	},
});
