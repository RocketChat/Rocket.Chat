import React from 'react';

const TaskDetailsModal = ({
	onUpdate,
	onCancel,
	taskTitle,
	taskDescription,
	taskAssignee,
	taskStatut,
	...props
}) => (
	<>
		{console.log(props)}
		<div>
			<h4>Task Title: </h4>
			<p>{taskTitle}</p>
		</div>
		<div>
			<h4>Task Description: </h4>
			<p>{taskDescription}</p>
		</div>
		<div>
			<h4>Task Assignee: </h4>
			<p>{taskAssignee}</p>
		</div>
		<div>
			<h4>Task Statut: </h4>
			<p>{taskStatut}</p>
		</div>
	</>
);

export default TaskDetailsModal;
