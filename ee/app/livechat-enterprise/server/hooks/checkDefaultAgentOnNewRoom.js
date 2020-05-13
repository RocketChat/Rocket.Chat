// import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks';
// import LivechatPriority from '../../../models/server/models/Li';

callbacks.add('livechat.checkDefaultAgentOnNewRoom', (agent, guest) => {
	if (agent) {
		return agent;
	}

	/*
	const { priority: searchTerm } = extraData;
	if (!searchTerm) {
		return roomInfo;
	}

	const priority = LivechatPriority.findOneByIdOrName(searchTerm);
	if (!priority) {
		throw new Meteor.Error('error-invalid-priority', 'Invalid priority', { function: 'livechat.beforeRoom' });
	}

	const { _id: priorityId } = priority;
	return Object.assign({ ...roomInfo }, { priorityId });
	*/
}, callbacks.priority.MEDIUM, 'livechat-check-default-agent-new-room');
