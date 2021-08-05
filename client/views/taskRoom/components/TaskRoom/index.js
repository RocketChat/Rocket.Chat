import { Tracker } from 'meteor/tracker';
import React, { useEffect, useState } from 'react';

import { ChatTask } from '../../../../../app/models/client';
import TaskRoom from './TaskRoom';

export default function WithData({ rid }) {
	const [tasks, setTasks] = useState([]);

	useEffect(() => {
		const query = {
			rid,
			_hidden: { $ne: true },
		};

		const options = {
			sort: {
				ts: 1,
			},
		};

		const computation = Tracker.autorun(async (computation) => {
			const tasks = ChatTask.find(query, options).fetch();

			if (!tasks || computation.stopped) {
				return;
			}

			setTasks(tasks);
		});

		return () => {
			computation.stop();
		};
	}, [tasks._id, rid]);

	return <TaskRoom rid={rid} tasks={tasks} setTasks={setTasks} />;
}
