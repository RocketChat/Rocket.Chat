import React from 'react';

const TaskDetailsModal = ({
	onUpdate,
	onCancel,
	taskTitle,
	taskDescription,
	taskAssignee,
	taskStatut,
	values,
	handlers,
	hasUnsavedChanges,
}) => (
	<>
		<div>
			<form>
				<label>
					<h4>Task Title: </h4>
				</label>
				<input type='text' value={values.taskTitle} onChange={handlers.handleTaskTitle} />
			</form>

			<p>{taskTitle}</p>
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
				<input type='text' value={taskAssignee} onChange={handlers.handleTaskAssignee} />
			</form>
		</div>
		<div>
			<form>
				<label>
					<h4>Task Statut: </h4>
				</label>
				<input type='text' value={taskStatut} onChange={handlers.handleTaskStatut} />
			</form>
		</div>
	</>
);

export default TaskDetailsModal;
