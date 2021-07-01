import React from 'react';

import TaskRoom from './TaskRoom';

export default function withData({ rid }) {
	return <TaskRoom rid={rid} />;
}
