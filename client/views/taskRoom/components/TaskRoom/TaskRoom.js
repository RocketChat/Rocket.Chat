import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useSetModal } from '../../../../contexts/ModalContext';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import TaskDetailsModal from '../../taskDetailsModal';
import Task from '../Task/Task';

export default function TaskRoom({ rid, tasks }) {
	const [taskTitle, setTaskTitle] = useState('');
	const setModal = useSetModal();
	const createTask = useEndpointActionExperimental('POST', 'taskRoom.createTask');

	const handleTask = (e) => {
		setTaskTitle(e.target.value);
	};

	const handleSave = useMutableCallback(async (e) => {
		e.preventDefault();
		const task = {};
		task.title = taskTitle;
		task.rid = rid;
		await createTask(task);
		setTaskTitle('');
	});

	const handleTaskDetails = (task) => {
		setModal(
			<TaskDetailsModal
				task={task}
				onCreate={() => setModal()}
				onClose={() => setModal()}
			></TaskDetailsModal>,
		);
	};

	return (
		<>
			<h1 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '3rem' }}>Tasks List</h1>
			<div style={{ overflowY: 'scroll' }}>
				{tasks !== undefined &&
					tasks.length &&
					tasks.map((task) => (
						<Task
							handleTaskDetails={() => handleTaskDetails(task)}
							rid={rid}
							title={task.title}
							username={task.u.username}
							taskId={task._id}
							ts={task.ts}
							status={task.taskStatus}
							taskAssignee={task.taskAssignee}
							key={task._id}
						/>
					))}
			</div>
			<form>
				<textarea
					placeholder='Create a new task'
					value={taskTitle}
					style={{
						width: '100%',
						position: 'absolute',
						bottom: '0',
						zIndex: '9999',
						backgroundColor: 'white',
					}}
					onChange={(e) => handleTask(e)}
				></textarea>
				<button type='submit' onClick={(e) => handleSave(e)}>
					Submit
				</button>
			</form>
		</>
	);
}
