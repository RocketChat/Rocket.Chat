import React, { useEffect, useState } from 'react';

import { useEndpoint } from '../../../../contexts/ServerContext';
import TaskRoom from './TaskRoom';

export default function WithData({ rid, _id, ...props }) {
	console.log(props);
	const [tasks, setTasks] = useState([]);
	const getHistory = useEndpoint('GET', `taskRoom.taskHistory?rid=${rid}`);

	useEffect(() => {
		const fetchData = async () => {
			const tasks = await getHistory();
			setTasks(tasks);
		};
		return () => fetchData();
	}, [tasks._id, _id, getHistory]);
	console.log(tasks);
	return <TaskRoom rid={rid} tasks={tasks} />;
}
