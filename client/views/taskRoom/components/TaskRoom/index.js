import { useTracker } from 'meteor/react-meteor-data';
import React from 'react';

import { ChatTask } from '../../../../../app/models/client';
import { useUserId } from '../../../../contexts/UserContext';
import TaskRoom from './TaskRoom';

export default function WithData({ rid }) {
	const userId = useUserId();
	const query = {
		rid,
		_hidden: { $ne: true },
	};

	const options = {
		sort: {
			ts: 1,
		},
	};
	const tasks = useTracker(() => ChatTask.find(query, options).fetch());

	return <TaskRoom rid={rid} tasks={tasks} userId={userId} />;
}
