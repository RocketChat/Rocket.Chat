import { Modal, ButtonGroup, Button, TextInput, Field, TextAreaInput } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import UserAutoCompleteMultiple from '../../../../ee/client/audit/UserAutoCompleteMultiple';
import { useTranslation } from '../../../contexts/TranslationContext';

const TaskDetailsModal = ({
	values,
	handlers,
	hasUnsavedChanges,
	onClose,
	onChangeAssignee,
	onUpdate,
}) => {
	const canSave = useMemo(() => hasUnsavedChanges, [hasUnsavedChanges]);
	const t = useTranslation();
	return (
		<>
			<Modal.Content>
				<Field mbe='x24'>
					<Field.Label>{t('Task_Title')}</Field.Label>
					<Field.Row>
						<TextInput value={values.taskTitle} onChange={handlers.handleTaskTitle} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Task_Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput
							rows={3}
							flexGrow={1}
							value={values.taskDescription}
							onChange={handlers.handleTaskDescription}
						/>
					</Field.Row>
				</Field>
				<Field mbe='x24'>
					<Field.Label>{t('Task_Assignee')}</Field.Label>
					<UserAutoCompleteMultiple value={values.taskAssignee} onChange={onChangeAssignee} />
				</Field>
				<Field mbe='x24'>
					<Field.Label>{t('Task_Statut')}</Field.Label>
					<Field.Row>
						<TextInput value={values.taskStatut} onChange={handlers.handleTaskStatut} />
					</Field.Row>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!canSave} onClick={onUpdate} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</>
	);
};

export default TaskDetailsModal;
