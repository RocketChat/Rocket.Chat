import { SyncedCron } from 'meteor/littledata:synced-cron';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../../../app/settings/server';
import { LivechatRooms, LivechatDepartment, Users } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';
import { LivechatEnterprise } from './LivechatEnterprise';

export class VisitorInactivityMonitor {
	constructor() {
		this._started = false;
		this._name = 'Omnichannel Visitor Inactivity Monitor';
		this.messageCache = new Map();
		this.userToPerformAutomaticClosing;
	}

	start() {
		this._startMonitoring();
		this._initializeMessageCache();
		this.userToPerformAutomaticClosing = Users.findOneById('rocket.cat');
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

	_initializeMessageCache() {
		this.messageCache.clear();
		this.messageCache.set('default', settings.get('Livechat_abandoned_rooms_closed_custom_message') || TAPi18n.__('Closed_automatically'));
	}

	_getDepartmentAbandonedCustomMessage(departmentId) {
		if (this.messageCache.has('departmentId')) {
			return this.messageCache.get('departmentId');
		}
		const department = LivechatDepartment.findOneById(departmentId);
		if (!department) {
			return;
		}
		this.messageCache.set(department._id, department.abandonedRoomsCloseCustomMessage);
		return department.abandonedRoomsCloseCustomMessage;
	}

	closeRooms(room) {
		let comment = this.messageCache.get('default');
		if (room.departmentId) {
			comment = this._getDepartmentAbandonedCustomMessage(room.departmentId) || comment;
		}
		Livechat.closeRoom({
			comment,
			room,
			user: this.userToPerformAutomaticClosing,
		});
	}

	placeRoomOnHold(room) {
		LivechatEnterprise.placeRoomOnHold(room);
		LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id);
	}

	handleAbandonedRooms() {
		const action = settings.get('Livechat_abandoned_rooms_action');
		if (!action || action === 'none') {
			return;
		}
		LivechatRooms.findAbandonedOpenRooms(new Date()).forEach((room) => {
			switch (action) {
				case 'close': {
					this.closeRooms(room);
					break;
				}
				case 'on-hold': {
					this.placeRoomOnHold(room);
					break;
				}
			}
		});
		this._initializeMessageCache();
	}
}
