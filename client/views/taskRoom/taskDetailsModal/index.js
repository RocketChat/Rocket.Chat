import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
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

	const onChangeAssignee = useMutableCallback((value, action) => {
		if (!action) {
			if (values.taskAssignee.includes(value)) {
				return;
			}
			return handlers.handleTaskAssignee([...values.taskAssignee, value]);
		}
		handlers.handleTaskAssignee(values.taskAssignee.filter((current) => current !== value));
	});

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
			onChangeAssignee={onChangeAssignee}
			{...props}
		/>
	);
};
export default TaskDetailsModalWithInfo;

export { TaskDetailsModal };
