import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import Task from '../Task/Task';

export default function TaskRoom({ rid, tasks }) {
	const [taskTitle, setTaskTitle] = useState('');

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
		// onChange();
		setTaskTitle('');
	});

	return (
		<>
			<h1 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '3rem' }}>Tasks List</h1>
			<div style={{ overflowY: 'scroll' }}>
				{tasks !== undefined &&
					tasks.length &&
					tasks.map((task) => (
						<Task
							title={task.title}
							username={task.u.username}
							taskId={task._id}
							ts={task.ts}
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
