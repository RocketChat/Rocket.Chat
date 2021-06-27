import React, { useMemo } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { useForm } from '../../../hooks/useForm';
import TaskDetailsModal from './taskDetailsModal';

const TaskDetailsModalWithInfo = ({ taskId, message, ...props }) => {
	const initialValues = {
		msg: message.msg ? message.msg : '',
		taskDescription: message.taskDescription ? message.taskDescription : '',
		taskAssignee: message.taskAssignee ? message.taskAssignee : '',
		taskStatut: message.taskStatut ? message.taskStatut : '',
	};

	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	return (
		<TaskDetailsModal
			taskTitle={message.msg}
			taskDescription={message.taskDescription}
			taskAssignee={message.taskAssignee}
			taskStatut={message.taskStatut}
			values={values}
			handlers={handlers}
			hasUnsavedChanges={hasUnsavedChanges}
			{...props}
		/>
	);
};
export default TaskDetailsModalWithInfo;

export { TaskDetailsModal };
