import { SyncedCron } from 'meteor/littledata:synced-cron';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Meteor } from 'meteor/meteor';
import { LivechatVisitors, LivechatRooms, LivechatDepartment, Users } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';
import { LivechatEnterprise } from './LivechatEnterprise';
import { logger } from './logger';

export class VisitorInactivityMonitor {
	constructor() {
		this._started = false;
		this._name = 'Omnichannel Visitor Inactivity Monitor';
		this.messageCache = new Map();
	}

	async start() {
		this._startMonitoring();
		this._initializeMessageCache();
		this.user = await Users.findOneById('rocket.cat');
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
				Promise.await(this.handleAbandonedRooms());
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

	async _getDepartmentAbandonedCustomMessage(departmentId) {
		if (this.messageCache.has('departmentId')) {
			return this.messageCache.get('departmentId');
		}
		const department = await LivechatDepartment.findOneById(departmentId);
		if (!department) {
			return;
		}
		this.messageCache.set(department._id, department.abandonedRoomsCloseCustomMessage);
		return department.abandonedRoomsCloseCustomMessage;
	}

	async closeRooms(room) {
		let comment = this.messageCache.get('default');
		if (room.departmentId) {
			comment = (await this._getDepartmentAbandonedCustomMessage(room.departmentId)) || comment;
		}
		Livechat.closeRoom({
			comment,
			room,
			user: this.user,
		});
	}

	async placeRoomOnHold(room) {
		const timeout = settings.get('Livechat_visitor_inactivity_timeout');

		const { v: { _id: visitorId } = {} } = room;
		const visitor = await LivechatVisitors.findOneById(visitorId);
		if (!visitor) {
			throw new Meteor.Error('error-invalid_visitor', 'Visitor Not found');
		}

		const guest = visitor.name || visitor.username;
		const comment = TAPi18n.__('Omnichannel_On_Hold_due_to_inactivity', { guest, timeout });

		const result = await Promise.allSettled([
			LivechatEnterprise.placeRoomOnHold(room, comment, this.user),
			LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id),
		]);
		const rejected = result.filter((r) => r.status === 'rejected').map((r) => r.reason);
		if (rejected.length) {
			logger.error({ msg: 'Error placing room on hold', error: rejected });

			throw new Error('Error placing room on hold. Please check logs for more details.');
		}
	}

	async handleAbandonedRooms() {
		const action = settings.get('Livechat_abandoned_rooms_action');
		if (!action || action === 'none') {
			return;
		}
		const result = await Promise.allSettled(
			LivechatRooms.findAbandonedOpenRooms(new Date()).forEach(async (room) => {
				switch (action) {
					case 'close': {
						await this.closeRooms(room);
						break;
					}
					case 'on-hold': {
						await this.placeRoomOnHold(room);
						break;
					}
				}
			}),
		);
		const rejected = result.filter((r) => r.status === 'rejected').map((r) => r.reason);
		if (rejected.length) {
			logger.error({ msg: `Error while removing priority from ${rejected.length} rooms`, reason: rejected[0] });
			logger.debug({ msg: 'Rejection results', rejected });
		}

		this._initializeMessageCache();
	}
}
