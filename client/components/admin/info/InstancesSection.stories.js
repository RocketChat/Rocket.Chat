import React from 'react';

import { dummyDate } from '../../../../.storybook/helpers';
import { InstancesSection } from './InstancesSection';

export default {
	title: 'admin/info/InstancesSection',
	component: InstancesSection,
};

const instances = [
	{
		address: 'instances[].address',
		broadcastAuth: 'instances[].broadcastAuth',
		currentStatus: {
			connected: 'instances[].currentStatus.connected',
			retryCount: 'instances[].currentStatus.retryCount',
			status: 'instances[].currentStatus.status',
		},
		instanceRecord: {
			_id: 'instances[].instanceRecord._id',
			pid: 'instances[].instanceRecord.pid',
			_createdAt: dummyDate,
			_updatedAt: dummyDate,
		},
	},
];

export const _default = () => <InstancesSection instances={instances} />;
