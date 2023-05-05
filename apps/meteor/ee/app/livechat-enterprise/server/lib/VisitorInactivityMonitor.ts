import type { IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms, LivechatDepartment, Users } from '@rocket.chat/models';
import { cronJobs } from '@rocket.chat/cron';

import { settings } from '../../../../../app/settings/server';
import { Livechat } from '../../../../../app/livechat/server/lib/LivechatTyped';
import { LivechatEnterprise } from './LivechatEnterprise';
import { logger } from './logger';
import { i18n } from '../../../../../server/lib/i18n';

const isPromiseRejectedResult = (result: any): result is PromiseRejectedResult => result && result.status === 'rejected';

export class VisitorInactivityMonitor {
	_started: boolean;

	_name: string;

	messageCache: Map<string, string>;

	user: IUser;

	private scheduler = cronJobs;

	constructor() {
		this._started = false;
		this._name = 'Omnichannel Visitor Inactivity Monitor';
		this.messageCache = new Map();
	}

	async start() {
		await this._startMonitoring();
		this._initializeMessageCache();
		const cat = await Users.findOneById('rocket.cat');
		if (cat) {
			this.user = cat;
		}
	}

	private async _startMonitoring() {
		if (this.isRunning()) {
			return;
		}
		const everyMinute = '* * * * *';
		await this.scheduler.add(this._name, everyMinute, async () => this.handleAbandonedRooms());
		this._started = true;
	}

	async stop() {
		if (!this.isRunning()) {
			return;
		}
		await this.scheduler.remove(this._name);

		this._started = false;
	}

	isRunning() {
		return this._started;
	}

	_initializeMessageCache() {
		this.messageCache.clear();
		this.messageCache.set('default', settings.get('Livechat_abandoned_rooms_closed_custom_message') || i18n.t('Closed_automatically'));
	}

	async _getDepartmentAbandonedCustomMessage(departmentId: string) {
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

	async closeRooms(room: IOmnichannelRoom) {
		let comment = this.messageCache.get('default');
		if (room.departmentId) {
			comment = (await this._getDepartmentAbandonedCustomMessage(room.departmentId)) || comment;
		}
		await Livechat.closeRoom({
			comment,
			room,
			user: this.user,
		});
	}

	async placeRoomOnHold(room: IOmnichannelRoom) {
		const timeout = settings.get<number>('Livechat_visitor_inactivity_timeout');

		const { v: { _id: visitorId } = {} } = room;
		if (!visitorId) {
			throw new Error('error-invalid_visitor');
		}

		const visitor = await LivechatVisitors.findOneById(visitorId);
		if (!visitor) {
			throw new Error('error-invalid_visitor');
		}

		const guest = visitor.name || visitor.username;
		const comment = i18n.t('Omnichannel_On_Hold_due_to_inactivity', { guest, timeout });

		const result = await Promise.allSettled([
			LivechatEnterprise.placeRoomOnHold(room, comment, this.user),
			LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id),
		]);
		const rejected = result.filter(isPromiseRejectedResult).map((r) => r.reason);
		if (rejected.length) {
			logger.error({ msg: 'Error placing room on hold', error: rejected });

			throw new Error('Error placing room on hold. Please check logs for more details.');
		}
	}

	async handleAbandonedRooms() {
		const action = settings.get<string>('Livechat_abandoned_rooms_action');
		if (!action || action === 'none') {
			return;
		}

		const promises: Promise<void>[] = [];
		await LivechatRooms.findAbandonedOpenRooms(new Date()).forEach((room) => {
			switch (action) {
				case 'close': {
					promises.push(this.closeRooms(room));
					break;
				}
				case 'on-hold': {
					promises.push(this.placeRoomOnHold(room));
					break;
				}
			}
		});

		const result = await Promise.allSettled(promises);

		const errors = result.filter(isPromiseRejectedResult).map((r) => r.reason);

		if (errors.length) {
			logger.error({ msg: `Error while removing priority from ${errors.length} rooms`, reason: errors[0] });
			logger.debug({ msg: 'Rejection results', errors });
		}

		this._initializeMessageCache();
	}
}
