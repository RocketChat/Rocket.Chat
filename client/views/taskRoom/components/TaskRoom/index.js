import { useTracker } from 'meteor/react-meteor-data';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useState } from 'react';

import { ChatTask } from '../../../../../app/models/client';
import { useEndpoint } from '../../../../contexts/ServerContext';
import TaskRoom from './TaskRoom';

const useTasks = (rid) => {
	const [tasks, setTasks] = useState(() =>
		Tracker.nonreactive(() => ChatTask.find({ rid }).fetch()),
	);
	const getTasks = useEndpoint('GET', 'taskRoom.taskHistory');

	useEffect(() => {
		const computation = Tracker.autorun(async (computation) => {
			const options = {
				sort: {
					ts: 1,
				},
			};
			const tasks = ChatTask.find({ rid }, options).fetch() || (await getTasks({ rid }));

			if (!tasks || computation.stopped) {
				return;
			}

			setTasks(tasks);
		});

		return () => {
			computation.stop();
		};
	}, [getTasks, rid]);

	return tasks;
};

export default function WithData({ rid }) {
	// const [tasks, setTasks] = useState([]);

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
	// const tasks = useTasks(rid);
	const tasks = useTracker(() => ChatTask.find(query, options).fetch());

	return <TaskRoom rid={rid} tasks={tasks} setTasks={() => console.log('ef')} />;
}
