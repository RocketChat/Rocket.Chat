import { Migrations } from '../../../app/migrations/server';
import { LivechatRooms, LivechatInquiry } from '../../../app/models/server';

Migrations.add({
	version: 180,
	up() {
		// Remove Old Omnichannel Inquiries related to rooms already closed
		LivechatInquiry.find({ status: 'queued' }).forEach((inquiry) => {
			const { rid } = inquiry;

			const room = LivechatRooms.findOneById(rid);
			if (!room || room.closedAt) {
				LivechatInquiry.removeByRoomId(rid);
			}
		});
	},
});
