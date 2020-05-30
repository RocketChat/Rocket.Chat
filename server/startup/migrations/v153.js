import { Migrations } from '../../migrations';
import { Settings, LivechatRooms, Rooms, LivechatInquiry } from '../../../app/models/server';
import { createLivechatInquiry } from '../../../app/livechat/server/lib/Helper';

Migrations.add({
	version: 153,
	up() {
		const oldSetting = Settings.findOne({ _id: 'Livechat_guest_pool_with_no_agents' });
		if (oldSetting) {
			const { _id } = oldSetting;

			delete oldSetting._id;
			delete oldSetting.enableQuery;
			delete oldSetting.ts;
			delete oldSetting._updatedAt;

			Settings.remove({ _id });

			Settings.upsert({ _id: 'Livechat_accept_chats_with_no_agents' }, oldSetting);
		}

		// Create Livechat inquiries for each open Livechat room
		LivechatRooms.findLivechat({ open: true }).forEach((room) => {
			const inquiry = LivechatInquiry.findOneByRoomId(room._id);
			if (!inquiry) {
				try {
					const { _id: rid, fname: name, v: guest } = room;
					createLivechatInquiry({ rid, name, guest, message: { msg: '' }, initialStatus: 'taken' });
				} catch (error) {
					console.error(error);
				}
			}
		});

		// There was a bug when closing livechat Rooms from the Widget side, the `ts` field was missing
		// when passing the Room object through the Livechat.closeRoom method
		// The `chatDuration` metric will be used to estimate the wait time in the new waiting queue feature
		Rooms.find({
			t: 'l',
			closedAt: { $exists: true },
			metrics: { $exists: true },
			'metrics.chatDuration': NaN,
		}).forEach((room) => {
			Rooms.update(
				room._id,
				{
					$set: {
						'metrics.chatDuration': (room.closedAt - room.ts) / 1000,
					},
				},
			);
		});

		// Change the status of the current open inquiries from "open" to "queued"
		LivechatInquiry.update(
			{ status: 'open' },
			{
				$set: {
					status: 'queued',
				},
			},
			{ multi: true },
		);
	},
});
