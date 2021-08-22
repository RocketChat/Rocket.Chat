import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';
import toastr from 'toastr';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import { useForm } from '../../../../hooks/useForm';
import CreateTaskModal from './CreateTaskModal';

const CreateTaskModalWithInfo = ({ onCreate, onClose, rid, ...props }) => {
	const t = useTranslation();
	const createTask = useEndpointActionExperimental('POST', 'taskRoom.createTask');

	const initialValues = {
		title: '',
		taskDescription: '',
		taskAssignee: '',
		taskStatus: '',
		rid,
	};

	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const { taskAssignee } = values;

	const handleSave = useMutableCallback(async () => {
		try {
			const data = await createTask(values);
			if (data.success) {
				// await Meteor.call('sendTask', data.task);
				toastr.success(t('Saved'));
			}
		} catch (error) {
			toastr.success(error.message);
		}

		onCreate();
	});

	const onChangeAssignee = useMutableCallback((value, action) => {
		if (!action) {
			if (taskAssignee.includes(value)) {
				return;
			}
			return handlers.handleTaskAssignee([...taskAssignee, value]);
		}
		handlers.handleTaskAssignee(taskAssignee.filter((current) => current !== value));
	});

	return (
		<CreateTaskModal
			values={values}
			handlers={handlers}
			hasUnsavedChanges={hasUnsavedChanges}
			onClose={onClose}
			onCreate={handleSave}
			t={t}
			onChangeAssignee={onChangeAssignee}
			{...props}
		/>
	);
};
export default CreateTaskModalWithInfo;
