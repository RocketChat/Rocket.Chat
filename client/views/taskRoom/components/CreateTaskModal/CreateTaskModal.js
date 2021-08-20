import { Modal, ButtonGroup, Button, TextInput, Field, TextAreaInput } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple/index.ts';

const CreateTaskModal = ({
	values,
	handlers,
	hasUnsavedChanges,
	onClose,
	onCreate,
	onChangeAssignee,
	t,
}) => {
	const canSave = useMemo(() => hasUnsavedChanges, [hasUnsavedChanges]);

	return (
		<Modal style={{ marginTop: '75px' }}>
			<Modal.Header>
				<Modal.Title>{t('Create a task')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe='x24'>
					<Field.Label>{t('TaskRoom_Task_Title')}</Field.Label>
					<Field.Description>
						{t("Put a title so you know what it's about at a glance")}
					</Field.Description>
					<Field.Row>
						<TextInput placeholder={'Title'} value={values.title} onChange={handlers.handleTitle} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('TaskRoom_Task_Description')}</Field.Label>
					<Field.Description>
						{t('A description that explains precisely what is to be done')}
					</Field.Description>
					<Field.Row>
						<TextAreaInput
							placeholder={'Description'}
							rows={3}
							flexGrow={1}
							value={values.taskDescription}
							onChange={handlers.handleTaskDescription}
						/>
					</Field.Row>
				</Field>
				<Field mbe='x24'>
					<Field.Label>{t('TaskRoom_Task_Assignee')}</Field.Label>
					<Field.Description>
						{t('Who is/are the person(s) responsible for carrying out this task')}
					</Field.Description>
					<UserAutoCompleteMultiple value={values.taskAssignee} onChange={onChangeAssignee} />
				</Field>
				<Field mbe='x24'>
					<Field.Label>{t('TaskRoom_Task_Status')}</Field.Label>
					<Field.Description>
						{t(
							'What the task status is. This is a category of the task, which will allow you to group them by',
						)}
					</Field.Description>
					<Field.Row>
						<TextInput
							placeholder={"e.g. 'Urgent, team front end'"}
							value={values.taskStatus}
							onChange={handlers.handleTaskStatus}
						/>
					</Field.Row>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!canSave || values.title.trim() === ''} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateTaskModal;
