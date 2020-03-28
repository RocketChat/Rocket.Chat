import { SyncedCron } from 'meteor/littledata:synced-cron';

import { settings } from '../../../../../app/settings/server';
import { LivechatRooms } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';

export class VisitorInactivityMonitor {
	start() {
		this._startMonitoring();
	}

	_startMonitoring() {
		const everyMinute = '* * * * *';
		SyncedCron.add({
			name: 'Visitor Inactivity Monitor',
			schedule: (parser) => parser.cron(everyMinute),
			job: () => {
				this._handleInactiveRooms();
			},
		});
	}

	closeRooms(room) {
		Livechat.closeRoom({
			comment: 'closed automatically by the system',
			room,
		});
	}

	freezeRooms(room) {
		LivechatRooms.freezeRoomById(room._id);
	}

	executeAction(action, room) {
		const actions = {
			close: (room) => this.closeRooms(room),
			freeze: (room) => this.freezeRooms(room),
		};
		actions[action](room);
	}

	_handleInactiveRooms() {
		if (!settings.get('Livechat_auto_close_inactive_rooms')) {
			return;
		}
		const action = settings.get('Livechat_auto_close_inactive_rooms_action');
		LivechatRooms.findInactiveOpenRooms(new Date()).forEach((room) => this.executeAction(action, room));
	}
}
