import type { IStats } from '@rocket.chat/core-typings';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import DeploymentCard from './DeploymentCard';

export default {
	title: 'Admin/Info/DeploymentCard',
	component: DeploymentCard,
	parameters: {
		layout: 'centered',
	},
	args: {
		info: {
			marketplaceApiVersion: '1.0.0',
			commit: {
				branch: 'master',
				hash: '1234567890',
				subject: 'This is a commit',
			},
		},
		statistics: {
			uniqueId: '',
			version: '1.0.0',
			process: {
				nodeVersion: '',
				pid: 0,
			},
			migration: {
				version: 272,
				lockedAt: '',
			},
			msEnabled: false,
			oplogEnabled: false,
			mongoVersion: '',
			mongoStorageEngine: '',
		} as IStats,
		instances: [],
	},
} as ComponentMeta<typeof DeploymentCard>;

const Template: ComponentStory<typeof DeploymentCard> = (args) => <DeploymentCard {...args} />;

export const Example = Template.bind({});
Example.storyName = 'DeploymentCard';
