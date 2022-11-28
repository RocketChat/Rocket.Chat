import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { LivechatInquiry, Users, LivechatRooms, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import LivechatUnit from '../../../models/server/models/LivechatUnit';
import LivechatTag from '../../../models/server/models/LivechatTag';
import { Messages } from '../../../../../app/models/server';
import { addUserRoles } from '../../../../../server/lib/roles/addUserRoles';
import { removeUserFromRoles } from '../../../../../server/lib/roles/removeUserFromRoles';
import { processWaitingQueue, removeSLAFromRooms, updateInquiryQueueSla, updateSLAInquiries, updateRoomSLAHistory } from './Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
import { logger, queueLogger } from './logger';
import { callbacks } from '../../../../../lib/callbacks';
import { AutoCloseOnHoldScheduler } from './AutoCloseOnHoldScheduler';
import { LivechatUnitMonitors } from '../../../models/server';

export const LivechatEnterprise = {
	async addMonitor(username) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:addMonitor',
			});
		}

		if (addUserRoles(user._id, ['livechat-monitor'])) {
			return user;
		}

		return false;
	},

	async removeMonitor(username) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:removeMonitor',
			});
		}

		const removeRoleResult = removeUserFromRoles(user._id, ['livechat-monitor']);
		if (!removeRoleResult) {
			return false;
		}

		// remove this monitor from any unit it is assigned to
		LivechatUnitMonitors.removeByMonitorId(user._id);

		return true;
	},

	removeUnit(_id) {
		check(_id, String);

		const unit = LivechatUnit.findOneById(_id, { fields: { _id: 1 } });

		if (!unit) {
			throw new Meteor.Error('unit-not-found', 'Unit not found', { method: 'livechat:removeUnit' });
		}

		return LivechatUnit.removeById(_id);
	},

	saveUnit(_id, unitData, unitMonitors, unitDepartments) {
		check(_id, Match.Maybe(String));

		check(unitData, {
			name: String,
			visibility: String,
			enabled: Match.Optional(Boolean),
			description: Match.Optional(String),
			email: Match.Optional(String),
			showOnOfflineForm: Match.Optional(Boolean),
		});

		check(unitMonitors, [
			Match.ObjectIncluding({
				monitorId: String,
				username: String,
			}),
		]);

		check(unitDepartments, [
			Match.ObjectIncluding({
				departmentId: String,
			}),
		]);

		let ancestors = [];
		if (_id) {
			const unit = LivechatUnit.findOneById(_id);
			if (!unit) {
				throw new Meteor.Error('error-unit-not-found', 'Unit not found', {
					method: 'livechat:saveUnit',
				});
			}

			ancestors = unit.ancestors;
		}

		return LivechatUnit.createOrUpdateUnit(_id, unitData, ancestors, unitMonitors, unitDepartments);
	},

	removeTag(_id) {
		check(_id, String);

		const tag = LivechatTag.findOneById(_id, { fields: { _id: 1 } });

		if (!tag) {
			throw new Meteor.Error('tag-not-found', 'Tag not found', { method: 'livechat:removeTag' });
		}

		return LivechatTag.removeById(_id);
	},

	saveTag(_id, tagData, tagDepartments) {
		check(_id, Match.Maybe(String));

		check(tagData, {
			name: String,
			description: Match.Optional(String),
		});

		check(tagDepartments, [String]);

		return LivechatTag.createOrUpdateTag(_id, tagData, tagDepartments);
	},

	// make async
	async saveSLA(_id, slaData) {
		check(_id, Match.Maybe(String));

		check(slaData, {
			name: String,
			description: Match.Optional(String),
			dueTimeInMinutes: Number,
		});

		const oldSLA = _id && (await OmnichannelServiceLevelAgreements.findOneById(_id, { projection: { dueTimeInMinutes: 1 } }));
		const sla = await OmnichannelServiceLevelAgreements.createOrUpdatePriority(slaData, _id);
		if (!oldSLA) {
			return sla;
		}

		const { dueTimeInMinutes: oldDueTimeInMinutes } = oldSLA;
		const { dueTimeInMinutes } = sla;

		if (oldDueTimeInMinutes !== dueTimeInMinutes) {
			await updateSLAInquiries(sla);
		}

		return sla;
	},

	async removeSLA(_id) {
		check(_id, String);

		const sla = await OmnichannelServiceLevelAgreements.findOneById(_id, { projection: { _id: 1 } });
		if (!sla) {
			throw new Error(`SLA with id ${_id} not found`);
		}

		const removedResult = await OmnichannelServiceLevelAgreements.removeById(_id);
		if (!removedResult || removedResult.deletedCount !== 1) {
			throw new Error(`Error removing SLA with id ${_id}`);
		}

		await removeSLAFromRooms(_id);
	},

	updateRoomSLA(roomId, user, sla) {
		updateInquiryQueueSla(roomId, sla);
		updateRoomSLAHistory(roomId, user, sla);
	},

	placeRoomOnHold(room, comment, onHoldBy) {
		logger.debug(`Attempting to place room ${room._id} on hold by user ${onHoldBy?._id}`);
		const { _id: roomId, onHold } = room;
		if (!roomId || onHold) {
			logger.debug(`Room ${roomId} invalid or already on hold. Skipping`);
			return false;
		}
		Promise.await(LivechatRooms.setOnHoldByRoomId(roomId));

		Messages.createOnHoldHistoryWithRoomIdMessageAndUser(roomId, comment, onHoldBy);
		Meteor.defer(() => {
			callbacks.run('livechat:afterOnHold', room);
		});

		logger.debug(`Room ${room._id} set on hold succesfully`);
		return true;
	},

	async releaseOnHoldChat(room) {
		const { _id: roomId, onHold } = room;
		if (!roomId || !onHold) {
			return;
		}

		await AutoCloseOnHoldScheduler.unscheduleRoom(roomId);
		await LivechatRooms.unsetOnHoldAndPredictedVisitorAbandonmentByRoomId(roomId);
	},
};

const DEFAULT_RACE_TIMEOUT = 5000;
let queueDelayTimeout = DEFAULT_RACE_TIMEOUT;

const queueWorker = {
	running: false,
	queues: [],
	async start() {
		queueLogger.debug('Starting queue');
		if (this.running) {
			queueLogger.debug('Queue already running');
			return;
		}

		const activeQueues = await this.getActiveQueues();
		queueLogger.debug(`Active queues: ${activeQueues.length}`);

		this.running = true;
		return this.execute();
	},
	async stop() {
		queueLogger.debug('Stopping queue');
		await LivechatInquiry.unlockAll();

		this.running = false;
	},
	async getActiveQueues() {
		// undefined = public queue(without department)
		return [undefined].concat(await LivechatInquiry.getDistinctQueuedDepartments());
	},
	async nextQueue() {
		if (!this.queues.length) {
			queueLogger.debug('No more registered queues. Refreshing');
			this.queues = await this.getActiveQueues();
		}

		return this.queues.shift();
	},
	async execute() {
		if (!this.running) {
			queueLogger.debug('Queue stopped. Cannot execute');
			return;
		}

		const queue = await this.nextQueue();
		queueLogger.debug(`Executing queue ${queue || 'Public'} with timeout of ${queueDelayTimeout}`);

		setTimeout(this.checkQueue.bind(this, queue), queueDelayTimeout);
	},

	async checkQueue(queue) {
		queueLogger.debug(`Processing items for queue ${queue || 'Public'}`);
		try {
			const nextInquiry = await LivechatInquiry.findNextAndLock(queue);
			if (!nextInquiry) {
				queueLogger.debug(`No more items for queue ${queue || 'Public'}`);
				return;
			}

			const result = await processWaitingQueue(queue, nextInquiry);

			if (!result) {
				await LivechatInquiry.unlock(nextInquiry._id);
			}
		} catch (e) {
			queueLogger.error({
				msg: `Error processing queue ${queue || 'public'}`,
				err: e,
			});
		} finally {
			this.execute();
		}
	},
};

let omnichannelIsEnabled = false;
function shouldQueueStart() {
	if (!omnichannelIsEnabled) {
		queueWorker.stop();
		return;
	}

	const routingSupportsAutoAssign = RoutingManager.getConfig().autoAssignAgent;
	queueLogger.debug(
		`Routing method ${RoutingManager.methodName} supports auto assignment: ${routingSupportsAutoAssign}. ${
			routingSupportsAutoAssign ? 'Starting' : 'Stopping'
		} queue`,
	);

	routingSupportsAutoAssign ? queueWorker.start() : queueWorker.stop();
}

RoutingManager.startQueue = shouldQueueStart;

settings.watch('Livechat_enabled', (enabled) => {
	omnichannelIsEnabled = enabled;
	omnichannelIsEnabled && RoutingManager.isMethodSet() ? shouldQueueStart() : queueWorker.stop();
});

settings.watch('Omnichannel_queue_delay_timeout', (timeout) => {
	queueDelayTimeout = timeout < 1 ? DEFAULT_RACE_TIMEOUT : timeout * 1000;
});
