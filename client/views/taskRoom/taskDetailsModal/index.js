import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useCallback } from 'react';
import toastr from 'toastr';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../hooks/useEndpointAction';
import { useForm } from '../../../hooks/useForm';
import TaskDetailsModal from './taskDetailsModal';

const TaskDetailsModalWithInfo = ({ taskId, task, onCreate, onClose, ...props }) => {
	const t = useTranslation();

	const updateTask = useEndpointActionExperimental('POST', 'taskRoom.taskUpdate');
	const deleteTask = useEndpointActionExperimental('POST', 'taskRoom.deleteTask');

	const initialValues = {
		taskTitle: task.title ? task.title : '',
		taskDescription: task.taskDescription ? task.taskDescription : '',
		taskAssignee: task.taskAssignee ? task.taskAssignee : '',
		taskStatus: task.taskStatus ? task.taskStatus : '',
	};

	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const { taskTitle, taskDescription, taskAssignee, taskStatus } = values;

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
			id: task._id,
			taskTitle,
			taskDescription,
			taskAssignee,
			taskStatus,
		};

		const data = await updateTask(params);

		if (data.success) {
			toastr.success(t('Saved'));
			onClose();
		}

		onClose();
	}, [taskTitle, taskDescription, taskAssignee, taskStatus, onClose, updateTask, task._id, t]);

	const onDelete = useCallback(async () => {
		const params = {
			taskId: task._id,
		};

		const data = await deleteTask(params);
		if (data.success) {
			toastr.success(t('Deleted'));
			onClose();
		}

		onClose();
	}, [onClose, deleteTask, task._id, t]);

	return (
		<TaskDetailsModal
			taskTitle={task.title}
			taskDescription={task.taskDescription}
			taskAssignee={task.taskAssignee}
			taskStatut={task.taskStatut}
			values={values}
			handlers={handlers}
			hasUnsavedChanges={hasUnsavedChanges}
			onClose={onClose}
			onChangeAssignee={onChangeAssignee}
			onDelete={onDelete}
			onUpdate={onUpdate}
			{...props}
		/>
	);
};
export default TaskDetailsModalWithInfo;

export { TaskDetailsModal };
