import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import Task from '../Task/Task';

export default function TaskRoom({ rid }) {
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

	const onAddTask = () => {
		setTaskTitle('');
	};
	console.log(taskTitle);
	return (
		<>
			<Task />
			<form>
				<textarea
					placeholder='Create a new task'
					value={taskTitle}
					onChange={(e) => handleTask(e)}
				></textarea>
				<button onClick={(e) => handleSave(e)}>Submit</button>
			</form>
		</>
	);
}
