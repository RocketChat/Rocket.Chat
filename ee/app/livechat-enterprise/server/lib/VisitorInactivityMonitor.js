import { SyncedCron } from 'meteor/littledata:synced-cron';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../../../app/settings/server';
import { LivechatRooms, LivechatDepartment } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';

export class VisitorInactivityMonitor {
	constructor() {
		this._started = false;
		this._name = 'Omnichannel Visitor Inactivity Monitor';
	}

	start() {
		this._startMonitoring();
	}

	_startMonitoring() {
		if (this.isRunning()) {
			return;
		}
		const everyMinute = '* * * * *';
		SyncedCron.add({
			name: this._name,
			schedule: (parser) => parser.cron(everyMinute),
			job: () => {
				this.handleAbandonedRooms();
			},
		});
		this._started = true;
	}

	stop() {
		if (!this.isRunning()) {
			return;
		}

		SyncedCron.remove(this._name);

		this._started = false;
	}

	isRunning() {
		return this._started;
	}

	closeRooms(room) {
		let comment = settings.get('Livechat_abandoned_rooms_closed_custom_message') || TAPi18n.__('Closed_automatically');
		if (room.departmentId) {
			const department = LivechatDepartment.findOneById(room.departmentId);
			comment = department.abandonedRoomsCloseCustomMessage || comment;
		}
		Livechat.closeRoom({
			comment,
			room,
		});
	}

	handleAbandonedRooms() {
		if (!settings.get('Livechat_auto_close_abandoned_rooms')) {
			return;
		}
		LivechatRooms.findAbandonedOpenRooms(new Date()).forEach((room) => this.closeRooms(room));
	}
}
