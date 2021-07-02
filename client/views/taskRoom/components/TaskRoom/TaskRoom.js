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

	const tasks = [
		{
			_id: 'zaJfKHcGxrmdjuNcn',
			title: 'srgfdrfg',
			rid: 'fFMqjMBxeniMY7ndF',
			ts: '2021-07-01T15:12:08.259-07:00',
			u: {
				_id: 'hqBcXkShzmCT6a25n',
				username: 'Jean.Staquet',
			},
			temp: true,
			_updatedAt: '2021-07-01T15:12:08.259-07:00',
		},
		{
			_id: 'P4voyPyrnwk5aEfzC',
			title: 'ui',
			rid: 'fFMqjMBxeniMY7ndF',
			ts: '2021-07-01T15:12:13.383-07:00',
			u: {
				_id: 'hqBcXkShzmCT6a25n',
				username: 'Jean.Staquet',
			},
			temp: true,
			_updatedAt: '2021-07-01T15:12:13.383-07:00',
		},
	];
	return (
		<>
			<h1 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '3rem' }}>Tasks List</h1>
			{tasks.map((task, index) => (
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
