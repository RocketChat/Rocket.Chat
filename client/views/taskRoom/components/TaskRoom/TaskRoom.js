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

	const loadHistory = () => {};

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
			{tasks !== undefined &&
				tasks.length &&
				tasks.map((task, index) => (
					<Task title={task.title} username={task.u.username} ts={task.ts} key={index} />
				))}
			<form>
				<textarea
					placeholder='Create a new task'
					value={taskTitle}
					style={{ width: '100%' }}
					onChange={(e) => handleTask(e)}
				></textarea>
				<button onClick={(e) => handleSave(e)}>Submit</button>
			</form>
		</>
	);
}
