import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import InstancesModal from './InstancesModal';

export default {
	title: 'Admin/Info/InstancesModal',
	component: InstancesModal,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		onClose: { action: 'onClose' },
	},
} as ComponentMeta<typeof InstancesModal>;

const Template: ComponentStory<typeof InstancesModal> = (args) => <InstancesModal {...args} />;

export const Default = Template.bind({});
Default.storyName = 'InstancesModal';
Default.args = {
	instances: [
		{
			address: 'http://localhost:3000',
			broadcastAuth: false,
			currentStatus: {
				connected: true,
				retryCount: 0,
				retryTime: 30000,
				status: 'running',
			},
			instanceRecord: {
				_id: 'instance-id',
				name: 'instance-name',
				pid: 123,
				_createdAt: new Date(),
				_updatedAt: new Date(),
				extraInformation: {
					host: '127.0.0.1',
					nodeVersion: 'v14.18.2',
					port: 3000,
				},
			},
		},
	],
};
