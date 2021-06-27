import { Modal, ButtonGroup, Button } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const TaskDetailsModal = ({ onCreate, values, handlers, hasUnsavedChanges, onClose }) => {
	const canSave = useMemo(() => hasUnsavedChanges, [hasUnsavedChanges]);
	const t = useTranslation();
	return (
		<>
			<div>
				<form>
					<label>
						<h4>Task Title: </h4>
					</label>
					<input type='text' value={values.taskTitle} onChange={handlers.handleTaskTitle} />
				</form>
			</div>
			<div>
				<form>
					<label>
						<h4>Task Description: </h4>
					</label>
					<input
						type='text'
						value={values.taskDescription}
						onChange={handlers.handleTaskDescription}
					/>
				</form>
			</div>
			<div>
				<form>
					<label>
						<h4>Task Assignee: </h4>
					</label>
					<input type='text' value={values.taskAssignee} onChange={handlers.handleTaskAssignee} />
				</form>
			</div>
			<div>
				<form>
					<label>
						<h4>Task Statut: </h4>
					</label>
					<input type='text' value={values.taskStatut} onChange={handlers.handleTaskStatut} />
				</form>
			</div>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!canSave} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</>
	);
};

export default TaskDetailsModal;
