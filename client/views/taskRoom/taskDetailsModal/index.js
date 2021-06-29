import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useCallback } from 'react';
import toastr from 'toastr';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../hooks/useEndpointAction';
import { useForm } from '../../../hooks/useForm';
import TaskDetailsModal from './taskDetailsModal';

const TaskDetailsModalWithInfo = ({ taskId, message, onCreate, onClose, ...props }) => {
	const t = useTranslation();

	const updateTask = useEndpointActionExperimental('POST', 'taskRoom.taskUpdate');

	const initialValues = {
		taskTitle: message.msg ? message.msg : '',
		taskDescription: message.taskDescription ? message.taskDescription : '',
		taskAssignee: message.taskAssignee ? message.taskAssignee : '',
		taskStatut: message.taskStatut ? message.taskStatut : '',
	};

	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const { taskTitle, taskDescription, taskAssignee, taskStatut } = values;

	const onChangeAssignee = useMutableCallback((value, action) => {
		if (!action) {
			if (taskAssignee.includes(value)) {
				return;
			}
			return handlers.handleTaskAssignee([...taskAssignee, value]);
		}
		handlers.handleTaskAssignee(taskAssignee.filter((current) => current !== value));
	});

	const onUpdate = useCallback(async () => {
		const params = {
			id: message._id,
			taskTitle,
			taskDescription,
			taskAssignee,
			taskStatut,
		};

		const data = await updateTask(params);

		if (data.success) {
			toastr.success(t('Saved'));
			onClose();
		}

		onClose();
	}, [taskTitle, taskDescription, taskAssignee, taskStatut, onClose, updateTask, message._id, t]);

	return (
		<TaskDetailsModal
			taskTitle={message.msg}
			taskDescription={message.taskDescription}
			taskAssignee={message.taskAssignee}
			taskStatut={message.taskStatut}
			values={values}
			handlers={handlers}
			hasUnsavedChanges={hasUnsavedChanges}
			onClose={onClose}
			onChangeAssignee={onChangeAssignee}
			onUpdate={onUpdate}
			{...props}
		/>
	);
};
export default TaskDetailsModalWithInfo;

export { TaskDetailsModal };
