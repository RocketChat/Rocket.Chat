import { LivechatDepartmentAgents } from '../../../../models/server';
import { Notifications } from '../../../../notifications';

const fields = { agentId: 1, departmentId: 1 };

const emitNotification = (action, payload = {}) => {
	const { agentId = null } = payload;
	if (!agentId) {
		return;
	}

	Notifications.notifyUserInThisInstance(agentId, 'departmentAgentData', {
		action,
		...payload,
	});
};

LivechatDepartmentAgents.on('change', ({ clientAction, id }) => {
	switch (clientAction) {
		case 'inserted':
		case 'updated':
			emitNotification(clientAction, LivechatDepartmentAgents.findOneById(id, { fields }));
			break;

		case 'removed':
			emitNotification(clientAction, LivechatDepartmentAgents.trashFindOneById(id, { fields }));
			break;
	}
});
