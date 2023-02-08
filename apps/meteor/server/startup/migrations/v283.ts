import { Settings, Permissions, LivechatRooms, LivechatInquiry, Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 283,
	async up() {
		// Removing all settings & permissions related to Legacy FB Messenger integration
		await Promise.all([
			Settings.deleteMany({
				_id: {
					$in: ['Livechat_Facebook_Enabled', 'Livechat_Facebook_API_Key', 'Livechat_Facebook_API_Secret'],
				},
			}),
			Permissions.removeById('view-livechat-facebook'),
		]);

		// close all open Fb Messenger rooms since the integration is no longer available
		const openRoomsIds = (
			await LivechatRooms.find(
				{
					open: true,
					facebook: { $exists: true },
				},
				{ projection: { _id: 1 } },
			).toArray()
		).map((room) => room._id);
		await Promise.all([
			LivechatRooms.updateMany(
				{
					_id: {
						$in: openRoomsIds,
					},
				},
				{
					$unset: {
						open: 1,
					},
				},
			),
			LivechatInquiry.deleteMany({
				rid: {
					$in: openRoomsIds,
				},
			}),
			...openRoomsIds.map((room) => Subscriptions.removeByRoomId(room)),
		]);
	},
});
