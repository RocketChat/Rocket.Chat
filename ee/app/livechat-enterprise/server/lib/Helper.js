import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { memoizeDebounce } from './debounceByParams';
import { LivechatDepartment, Users, LivechatInquiry, LivechatRooms, Messages, LivechatCustomField } from '../../../../../app/models/server';
import { Rooms as RoomRaw } from '../../../../../app/models/server/raw';
import { settings } from '../../../../../app/settings';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { dispatchAgentDelegated } from '../../../../../app/livechat/server/lib/Helper';
import notifications from '../../../../../app/notifications/server/lib/Notifications';
import { logger, helperLogger } from './logger';
import { OmnichannelQueueInactivityMonitor } from './QueueInactivityMonitor';

export const getMaxNumberSimultaneousChat = ({ agentId, departmentId }) => {
	if (departmentId) {
		const department = LivechatDepartment.findOneById(departmentId);
		const { maxNumberSimultaneousChat } = department || {};
		if (maxNumberSimultaneousChat > 0) {
			return maxNumberSimultaneousChat;
		}
	}

	if (agentId) {
		const user = Users.getAgentInfo(agentId);
		const { livechat: { maxNumberSimultaneousChat } = {} } = user || {};
		if (maxNumberSimultaneousChat > 0) {
			return maxNumberSimultaneousChat;
		}
	}

	return settings.get('Livechat_maximum_chats_per_agent');
};

const getWaitingQueueMessage = (departmentId) => {
	const department = departmentId && LivechatDepartment.findOneById(departmentId);
	if (department && department.waitingQueueMessage) {
		return department.waitingQueueMessage;
	}

	return settings.get('Livechat_waiting_queue_message');
};

const getQueueInfo = async (department) => {
	const numberMostRecentChats = settings.get('Livechat_number_most_recent_chats_estimate_wait_time');
	const statistics = await RoomRaw.getMostRecentAverageChatDurationTime(numberMostRecentChats, department);
	const text = getWaitingQueueMessage(department);
	const message = {
		text,
		user: { _id: 'rocket.cat', username: 'rocket.cat' },
	};
	return { message, statistics, numberMostRecentChats };
};

const getSpotEstimatedWaitTime = (spot, maxNumberSimultaneousChat, avgChatDuration) => {
	if (!maxNumberSimultaneousChat || !avgChatDuration) {
		return;
	}
	// X = spot
	// N = maxNumberSimultaneousChat
	// Estimated Wait Time = ([(N-1)/X]+1) *Average Chat Time of Most Recent X(Default = 100) Chats
	return ((spot - 1) / maxNumberSimultaneousChat + 1) * avgChatDuration;
};

export const normalizeQueueInfo = async ({ position, queueInfo, department }) => {
	if (!queueInfo) {
		queueInfo = await getQueueInfo(department);
	}

	const { message, numberMostRecentChats, statistics: { avgChatDuration } = {} } = queueInfo;
	const spot = position + 1;
	const estimatedWaitTimeSeconds = getSpotEstimatedWaitTime(spot, numberMostRecentChats, avgChatDuration);
	return { spot, message, estimatedWaitTimeSeconds };
};

export const dispatchInquiryPosition = async (inquiry, queueInfo) => {
	const { position, department } = inquiry;
	const data = await normalizeQueueInfo({ position, queueInfo, department });
	const propagateInquiryPosition = Meteor.bindEnvironment((inquiry) => {
		notifications.streamLivechatRoom.emit(inquiry.rid, {
			type: 'queueData',
			data,
		});
	});

	return setTimeout(() => {
		propagateInquiryPosition(inquiry);
	}, 1000);
};

export const dispatchWaitingQueueStatus = async (department) => {
	if (!settings.get('Livechat_waiting_queue') && !settings.get('Omnichannel_calculate_dispatch_service_queue_statistics')) {
		return;
	}

	helperLogger.debug(`Updating statuses for queue ${department || 'Public'}`);
	const queue = await LivechatInquiry.getCurrentSortedQueueAsync({ department });

	if (!queue.length) {
		return;
	}

	const queueInfo = await getQueueInfo(department);
	queue.forEach((inquiry) => {
		dispatchInquiryPosition(inquiry, queueInfo);
	});
};

// When dealing with lots of queued items we need to make sure to notify their position
// but we don't need to notify _each_ change that takes place, just their final position
export const debouncedDispatchWaitingQueueStatus = memoizeDebounce(dispatchWaitingQueueStatus, 1200);

export const processWaitingQueue = async (department) => {
	const queue = department || 'Public';
	helperLogger.debug(`Processing items on queue ${queue}`);
	const inquiry = LivechatInquiry.getNextInquiryQueued(department);
	if (!inquiry) {
		helperLogger.debug(`No items to process on queue ${queue}`);
		return;
	}

	helperLogger.debug(`Processing inquiry ${inquiry._id} from queue ${queue}`);
	const { defaultAgent } = inquiry;
	const room = await RoutingManager.delegateInquiry(inquiry, defaultAgent);

	const propagateAgentDelegated = Meteor.bindEnvironment((rid, agentId) => {
		dispatchAgentDelegated(rid, agentId);
	});

	if (room && room.servedBy) {
		const {
			_id: rid,
			servedBy: { _id: agentId },
		} = room;
		helperLogger.debug(`Inquiry ${inquiry._id} taken successfully by agent ${agentId}. Notifying`);
		return setTimeout(() => {
			propagateAgentDelegated(rid, agentId);
		}, 1000);
	}
};

export const setPredictedVisitorAbandonmentTime = (room) => {
	if (
		!room.v ||
		!room.v.lastMessageTs ||
		!settings.get('Livechat_abandoned_rooms_action') ||
		settings.get('Livechat_abandoned_rooms_action') === 'none'
	) {
		return;
	}

	let secondsToAdd = settings.get('Livechat_visitor_inactivity_timeout');

	const department = room.departmentId && LivechatDepartment.findOneById(room.departmentId);
	if (department && department.visitorInactivityTimeoutInSeconds) {
		secondsToAdd = department.visitorInactivityTimeoutInSeconds;
	}

	if (secondsToAdd <= 0) {
		return;
	}

	const willBeAbandonedAt = moment(room.v.lastMessageTs).add(Number(secondsToAdd), 'seconds').toDate();
	LivechatRooms.setPredictedVisitorAbandonment(room._id, willBeAbandonedAt);
};

export const updatePredictedVisitorAbandonment = () => {
	if (!settings.get('Livechat_abandoned_rooms_action') || settings.get('Livechat_abandoned_rooms_action') === 'none') {
		LivechatRooms.unsetPredictedVisitorAbandonment();
	} else {
		LivechatRooms.findLivechat({ open: true }).forEach((room) => setPredictedVisitorAbandonmentTime(room));
	}
};

export const updateQueueInactivityTimeout = () => {
	const queueTimeout = settings.get('Livechat_max_queue_wait_time');
	if (queueTimeout <= 0) {
		logger.debug('QueueInactivityTimer: Disabling scheduled closing');
		OmnichannelQueueInactivityMonitor.stop();
		return;
	}

	logger.debug('QueueInactivityTimer: Updating estimated inactivity time for queued items');
	LivechatInquiry.getQueuedInquiries({ fields: { _updatedAt: 1 } }).forEach((inq) => {
		const aggregatedDate = moment(inq._updatedAt).add(queueTimeout, 'minutes');
		try {
			return OmnichannelQueueInactivityMonitor.scheduleInquiry(inq._id, new Date(aggregatedDate.format()));
		} catch (e) {
			// this will usually happen if other instance attempts to re-create a job
			logger.error({ err: e });
		}
	});
};

export const updateRoomPriorityHistory = (rid, user, priority) => {
	const history = {
		priorityData: {
			definedBy: user,
			priority: priority || {},
		},
	};

	Messages.createPriorityHistoryWithRoomIdMessageAndUser(rid, '', user, history);
};

export const updateInquiryQueuePriority = (roomId, priority) => {
	const inquiry = LivechatInquiry.findOneByRoomId(roomId, { fields: { rid: 1, ts: 1 } });
	if (!inquiry) {
		return;
	}

	let { ts: estimatedServiceTimeAt } = inquiry;
	let queueOrder = 1;
	let estimatedWaitingTimeQueue = 0;

	if (priority) {
		const { dueTimeInMinutes } = priority;
		queueOrder = 0;
		estimatedWaitingTimeQueue = dueTimeInMinutes;
		estimatedServiceTimeAt = new Date(estimatedServiceTimeAt.setMinutes(estimatedServiceTimeAt.getMinutes() + dueTimeInMinutes));
	}

	LivechatInquiry.setEstimatedServiceTimeAt(inquiry.rid, {
		queueOrder,
		estimatedWaitingTimeQueue,
		estimatedServiceTimeAt,
	});
};

export const removePriorityFromRooms = (priorityId) => {
	LivechatRooms.findOpenByPriorityId(priorityId).forEach((room) => {
		updateInquiryQueuePriority(room._id);
	});

	LivechatRooms.unsetPriorityById(priorityId);
};

export const updatePriorityInquiries = (priority) => {
	if (!priority) {
		return;
	}

	const { _id: priorityId } = priority;
	LivechatRooms.findOpenByPriorityId(priorityId).forEach((room) => {
		updateInquiryQueuePriority(room._id, priority);
	});
};

export const getLivechatCustomFields = () => {
	const customFields = LivechatCustomField.find({
		visibility: 'visible',
		scope: 'visitor',
		public: true,
	}).fetch();
	return customFields.map(({ _id, label, regexp, required = false, type, defaultValue = null, options }) => ({
		_id,
		label,
		regexp,
		required,
		type,
		defaultValue,
		...(options && options !== '' && { options: options.split(',') }),
	}));
};

export const getLivechatQueueInfo = async (room) => {
	if (!room) {
		return null;
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return null;
	}

	if (!settings.get('Omnichannel_calculate_dispatch_service_queue_statistics')) {
		return null;
	}

	const { _id: rid, departmentId: department } = room;
	const inquiry = LivechatInquiry.findOneByRoomId(rid, { fields: { _id: 1, status: 1 } });
	if (!inquiry) {
		return null;
	}

	const { _id, status } = inquiry;
	if (status !== 'queued') {
		return null;
	}

	const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({ _id, department });

	if (!inq) {
		return null;
	}

	return normalizeQueueInfo(inq);
};
