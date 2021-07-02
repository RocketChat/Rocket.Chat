import React, { useEffect, useState } from 'react';

import { useEndpoint } from '../../../../contexts/ServerContext';
import TaskRoom from './TaskRoom';

export default function WithData({ rid }) {
	const [tasks, setTasks] = useState([]);
	const getHistory = useEndpoint('GET', 'taskRoom.taskHistory');

	// useEffect(() => {
	// 	const fetchData = async () => {
	// 		const { tasks } = await getHistory(rid);
	// 		setTasks(tasks);
	// 	};
	// 	fetchData();
	// }, [tasks]);
	console.log(tasks);
	return <TaskRoom rid={rid} tasks={tasks} />;
}
