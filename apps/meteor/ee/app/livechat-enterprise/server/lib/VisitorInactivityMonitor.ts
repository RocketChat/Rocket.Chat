import { OmnichannelEEService } from '@rocket.chat/core-services';
import type { ILivechatVisitor, IOmnichannelRoom, IUser, ILivechatDepartment } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatVisitors, LivechatRooms, LivechatDepartment, Users } from '@rocket.chat/models';

import { schedulerLogger } from './logger';
import { notifyOnRoomChangedById } from '../../../../../app/lib/server/lib/notifyListener';
import { closeRoom } from '../../../../../app/livechat/server/lib/closeRoom';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { i18n } from '../../../../../server/lib/i18n';

const isPromiseRejectedResult = (result: any): result is PromiseRejectedResult => result && result.status === 'rejected';

export class VisitorInactivityMonitor {
	_started: boolean;

	_name: string;

	messageCache: Map<string, string>;

	user: IUser;

	logger: MainLogger;

	private scheduler = cronJobs;

	constructor() {
		this._started = false;
		this._name = 'Omnichannel Visitor Inactivity Monitor';
		this.messageCache = new Map();
		this.logger = schedulerLogger.section(this._name);
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
			this.logger.debug('Already running');
			return;
		}
		const everyMinute = '* * * * *';
		await this.scheduler.add(this._name, everyMinute, async () => this.handleAbandonedRooms());
		this._started = true;
		this.logger.info('Service started');
	}

	async stop() {
		if (!this.isRunning()) {
			return;
		}
		await this.scheduler.remove(this._name);

		this._started = false;
		this.logger.info('Service stopped');
	}

	isRunning() {
		return this._started;
	}

	_initializeMessageCache() {
		this.messageCache.clear();
	}

	async _getDepartmentAbandonedCustomMessage(departmentId: string) {
		if (this.messageCache.has(departmentId)) {
			return this.messageCache.get(departmentId);
		}
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'abandonedRoomsCloseCustomMessage'>>(
			departmentId,
			{ projection: { _id: 1, abandonedRoomsCloseCustomMessage: 1 } },
		);
		if (!department) {
			this.logger.error(`Department ${departmentId} not found`);
			return;
		}
		this.messageCache.set(department._id, department.abandonedRoomsCloseCustomMessage);
		return department.abandonedRoomsCloseCustomMessage;
	}

	async closeRooms(room: IOmnichannelRoom) {
		let comment = await this.getDefaultAbandonedCustomMessage('close', room.v._id);
		if (room.departmentId) {
			comment = (await this._getDepartmentAbandonedCustomMessage(room.departmentId)) || comment;
		}
		await closeRoom({
			comment,
			room,
			user: this.user,
		});
		void notifyOnRoomChangedById(room._id);
		this.logger.info(`Room ${room._id} closed`);
	}

	async placeRoomOnHold(room: IOmnichannelRoom) {
		const comment = await this.getDefaultAbandonedCustomMessage('on-hold', room.v._id);

		const result = await Promise.allSettled([
			OmnichannelEEService.placeRoomOnHold(room, comment, this.user),
			LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id),
		]);
		const rejected = result.filter(isPromiseRejectedResult).map((r) => r.reason);
		if (rejected.length) {
			this.logger.error({ msg: 'Error placing room on hold', error: rejected });
			throw new Error('Error placing room on hold. Please check logs for more details.');
		}

		void notifyOnRoomChangedById(room._id);
	}

	async handleAbandonedRooms() {
		const action = settings.get<string>('Livechat_abandoned_rooms_action');
		if (!action || action === 'none') {
			return;
		}

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		const promises: Promise<void>[] = [];
		await LivechatRooms.findAbandonedOpenRooms(new Date(), extraQuery).forEach((room) => {
			switch (action) {
				case 'close': {
					this.logger.info(`Closing room ${room._id}`);
					promises.push(this.closeRooms(room));
					break;
				}
				case 'on-hold': {
					this.logger.info(`Placing room ${room._id} on hold`);
					promises.push(this.placeRoomOnHold(room));
					break;
				}
			}
		});

		const result = await Promise.allSettled(promises);

		const errors = result.filter(isPromiseRejectedResult).map((r) => r.reason);

		if (errors.length) {
			this.logger.error({ msg: `Error while removing priority from ${errors.length} rooms`, reason: errors[0] });
		}

		this._initializeMessageCache();
	}

	private async getDefaultAbandonedCustomMessage(abandonmentAction: 'close' | 'on-hold', visitorId: string) {
		const visitor = await LivechatVisitors.findOneEnabledById<Pick<ILivechatVisitor, 'name' | 'username'>>(visitorId, {
			projection: {
				name: 1,
				username: 1,
			},
		});
		if (!visitor) {
			this.logger.error({
				msg: 'Error getting default abandoned custom message: visitor not found',
				visitorId,
			});
			throw new Error('error-invalid_visitor');
		}

		const timeout = settings.get<number>('Livechat_visitor_inactivity_timeout');

		const guest = visitor.name || visitor.username;

		if (abandonmentAction === 'on-hold') {
			return i18n.t('Omnichannel_On_Hold_due_to_inactivity', {
				guest,
				timeout,
			});
		}

		return (
			settings.get<string>('Livechat_abandoned_rooms_closed_custom_message') ||
			i18n.t('Omnichannel_chat_closed_due_to_inactivity', {
				guest,
				timeout,
			})
		);
	}
}
