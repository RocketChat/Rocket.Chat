import { SyncedCron } from 'meteor/littledata:synced-cron';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Meteor } from 'meteor/meteor';
import { LivechatVisitors, LivechatRooms, LivechatDepartment, Users } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';
import { LivechatEnterprise } from './LivechatEnterprise';

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

		LivechatEnterprise.placeRoomOnHold(room, comment, this.user) &&
			(await LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id));
	}

	handleAbandonedRooms() {
		const action = settings.get('Livechat_abandoned_rooms_action');
		if (!action || action === 'none') {
			return;
		}
		// TODO: change this to an async map or reduce
		Promise.await(LivechatRooms.findAbandonedOpenRooms(new Date())).forEach((room) => {
			switch (action) {
				case 'close': {
					Promise.await(this.closeRooms(room));
					break;
				}
				case 'on-hold': {
					Promise.await(this.placeRoomOnHold(room));
					break;
				}
			}
		});
		this._initializeMessageCache();
	}
}
