import React, { useEffect, useState } from 'react';

import { useEndpoint } from '../../../../contexts/ServerContext';
import TaskRoom from './TaskRoom';

export default function WithData({ rid }) {
	const [tasks, setTasks] = useState([]);
	const getHistory = useEndpoint('GET', `taskRoom.taskHistory?rid=${rid}`);

	useEffect(() => {
		const fetchData = async () => {
			const tasks = await getHistory();
			setTasks(tasks);
		};
		fetchData();
	}, [tasks._id, rid, getHistory]);

	return <TaskRoom rid={rid} tasks={tasks} />;
}
