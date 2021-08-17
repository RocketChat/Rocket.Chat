import { SyncedCron } from 'meteor/littledata:synced-cron';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';

import { settings } from '../../../../../app/settings/server';
import { Logger } from '../../../../../app/logger';
import { LivechatRooms, Users, LivechatInquiry } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';

export class QueueInactivityMonitor {
	constructor() {
		this._started = false;
		this._name = 'Omnichannel Queue Inactivity Monitor';
		this.messageCache = new Map();
		this.logger = new Logger('QueueInactivityMonitor');
	}

	start() {
		this._startMonitoring();
		this._initializeMessageCache();
		this.user = Users.findOneById('rocket.cat');
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
		this.logger.debug('Initializing messages cache');
		this.messageCache.clear();
		this.messageCache.set('default', TAPi18n.__('Closed_automatically_chat_queued_too_long'));
	}

	closeRooms(room) {
		const comment = this.messageCache.get('default');
		console.log({ comment, room, user: this.user });
		Livechat.closeRoom({
			comment,
			room,
			user: this.user,
		});
	}

	handleAbandonedRooms() {
		const action = settings.get('Livechat_max_queue_wait_time_action');
		this.logger.debug(`Processing dangling queued items with action ${ action }`);
		let counter = 0;
		if (!action || action === 'Nothing') {
			return;
		}

		LivechatInquiry.getAbandonedQueuedItems(moment().utc()).forEach((inquiry) => {
			switch (action) {
				case 'Close_chat': {
					counter++;
					this.closeRooms(LivechatRooms.findOneByIdOrName(inquiry.rid));
					break;
				}
			}
		});

		this.logger.debug(`Running succesful. Closed ${ counter } queued items because of inactivity`);
	}
}
