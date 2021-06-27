import React, { useMemo } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { useForm } from '../../../hooks/useForm';
import TaskDetailsModal from './taskDetailsModal';

const TaskDetailsModalWithInfo = ({ taskId, message, onCreate, onClose, ...props }) => {
	const initialValues = {
		taskTitle: message.msg ? message.msg : '',
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
			onCreate={onCreate}
			onClose={onClose}
			{...props}
		/>
	);
};
export default TaskDetailsModalWithInfo;

export { TaskDetailsModal };
