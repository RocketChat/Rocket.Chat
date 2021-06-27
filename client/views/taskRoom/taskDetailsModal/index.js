import React, { useMemo } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import TaskDetailsModal from './taskDetailsModal';

const TaskDetailsModalWithInfo = ({ taskId, ...props }) => {
	console.log(props);
	const { message } = useEndpointData(
		'taskRoom.taskDetails',
		useMemo(() => ({ taskId }), [taskId]),
	);
	return <TaskDetailsModal message={message} />;
};

export default TaskDetailsModalWithInfo;

export { TaskDetailsModal };
