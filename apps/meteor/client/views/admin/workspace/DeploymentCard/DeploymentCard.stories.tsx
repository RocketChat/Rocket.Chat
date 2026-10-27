import type { IStats } from '@rocket.chat/core-typings';
import type { Meta } from '@storybook/react';

import DeploymentCard from './DeploymentCard';

export default {
	component: DeploymentCard,
	parameters: {
		layout: 'centered',
	},
	args: {
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
		serverInfo: {
			info: {
				commit: {},
				marketplaceApiVersion: '',
				build: {
					date: '',
					arch: '',
					platform: '',
					cpus: 0,
					freeMemory: 0,
					totalMemory: 0,
					nodeVersion: '',
					osRelease: '',
				},
				version: '',
			},
			cloudWorkspaceId: '',
			minimumClientVersions: {
				desktop: '',
				mobile: '',
			},
			version: '',
		},
	},
} satisfies Meta<typeof DeploymentCard>;

export const Example = {
	name: 'DeploymentCard',
};
