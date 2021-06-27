import React, { useMemo } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import TaskDetailsModal from './taskDetailsModal';

const TaskDetailsModalWithInfo = ({ taskId, message, ...props }) => (
	// const { message } = useEndpointData(
	// 	'taskRoom.taskDetails',
	// 	useMemo(() => ({ taskId }), [taskId]),
	// );

	<TaskDetailsModal
		taskTitle={message.msg}
		taskDescription={message.taskDescription}
		taskAssignee={message.taskAssignee}
		taskStatut={message.taskStatut}
	/>
);
export default TaskDetailsModalWithInfo;

export { TaskDetailsModal };
