import { Tracker } from 'meteor/tracker';
import React, { useEffect, useState } from 'react';

import { useEndpoint } from '../../../../contexts/ServerContext';
import TaskRoom from './TaskRoom';

export default function WithData({ rid }) {
	const [tasks, setTasks] = useState([]);
	const getHistory = useEndpoint('GET', `taskRoom.taskHistory?rid=${rid}`);

	useEffect(() => {
		const computation = Tracker.autorun(async (computation) => {
			const tasks = await getHistory();

			if (!tasks || computation.stopped) {
				return;
			}

			setTasks(tasks);
		});

		return () => {
			computation.stop();
		};
	}, [tasks._id, rid, getHistory]);

	return <TaskRoom rid={rid} tasks={tasks} setTasks={setTasks} />;
}
