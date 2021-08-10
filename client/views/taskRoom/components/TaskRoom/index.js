import { useTracker } from 'meteor/react-meteor-data';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useState } from 'react';

import { ChatTask } from '../../../../../app/models/client';
import TaskRoom from './TaskRoom';

export default function WithData({ rid }) {
	// const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(false);

	// useEffect(() => {
	const query = {
		rid,
		_hidden: { $ne: true },
	};

	const options = {
		sort: {
			ts: 1,
		},
	};

	// 	const computation = Tracker.autorun(async (computation) => {
	// 		setLoading(true);
	// 		const tasks = ChatTask.find(query, options).fetch();
	// 		console.log('fetch takss');
	// 		if (!tasks || computation.stopped) {
	// 			return;
	// 		}
	// 		setLoading(false);
	// 		setTasks(tasks);
	// 	});

	// 	return () => {
	// 		console.log('computation stop');
	// 		computation.stop();
	// 	};
	// }, [tasks._id, rid, tasks.tcount, tasks.editedAt]);

	const tasks = useTracker(() => ChatTask.find(query, options).fetch());

	return <TaskRoom rid={rid} tasks={tasks} loading={loading} setTasks={setTasks} />;
}
