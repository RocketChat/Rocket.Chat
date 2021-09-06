import { Modal, ButtonGroup, Button, TextInput, Field, TextAreaInput } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple/index.ts';
import { useTranslation } from '../../../contexts/TranslationContext';

const TaskDetailsModal = ({
	values,
	handlers,
	hasUnsavedChanges,
	onClose,
	onChangeAssignee,
	onUpdate,
	onDelete,
}) => {
	const canSave = useMemo(() => hasUnsavedChanges, [hasUnsavedChanges]);
	const t = useTranslation();
	return (
		<Modal style={{ marginTop: '150px' }}>
			<Modal.Header>
				<Modal.Title>{t('Task Details')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe='x24'>
					<Field.Label>{t('TaskRoom_Task_Title')}</Field.Label>
					<Field.Row>
						<TextInput value={values.taskTitle} onChange={handlers.handleTaskTitle} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('TaskRoom_Task_Description')}</Field.Label>
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
					<Field.Label>{t('TaskRoom_Task_Assignee')}</Field.Label>
					<UserAutoCompleteMultiple value={values.taskAssignee} onChange={onChangeAssignee} />
				</Field>
				<Field mbe='x24'>
					<Field.Label>{t('TaskRoom_Task_Status')}</Field.Label>
					<Field.Row>
						<TextInput value={values.taskStatus} onChange={handlers.handleTaskStatus} />
					</Field.Row>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onDelete} primary danger>
						{t('Delete')}
					</Button>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!canSave} onClick={onUpdate} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default TaskDetailsModal;
