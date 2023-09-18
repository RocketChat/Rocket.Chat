import type { IServerInfo } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function getServerInfo(userId?: string): Promise<IServerInfo> {
	if (userId && (await hasPermissionAsync(userId, 'get-server-info'))) {
		return MOCK_PAYLOAD;
	}
	return MOCK_PAYLOAD;
}

const MOCK_PAYLOAD: IServerInfo = {
	success: true,
	info: {
		version: '6.4.0',
		build: {
			date: '2021-09-08T18:44:25.719+0000',
			nodeVersion: 'v12.22.1',
			arch: 'x64',
			platform: 'linux',
			osRelease: '5.4.0-1045-azure',
			totalMemory: 17179869184,
			freeMemory: 17179869184,
			cpus: 4,
		},
		marketplaceApiVersion: '1',
		commit: {
			hash: '64d28d096400df50b6ace670',
			date: '2021-09-08T18:44:25.719+0000',
			author: 'hugocostadev',
			subject: 'Merge pull request #22789 from RocketChat/fix/missing-translation',
			tag: '3.0.0',
			branch: 'master',
		},
	},
	supportedVersions: {
		timestamp: '2021-09-08T18:44:25.719+0000',
		versions: [
			{
				version: '6.5.0',
				expiration: new Date('2024-09-29T18:44:25.719+0000'),
				messages: [
					{
						remainingDays: 0,
						title: 'message_token',
						subtitle: 'message_token',
						description: 'message_token',
						type: 'info',
						params: {
							instance_ws_name: 'Rocket.Chat',
							instance_username: 'admin',
							instance_email: 'admin@rocket.chat',
							instance_domain: 'localhost',
							remaining_days: 0,
						},
						link: 'https://rocket.chat',
					},
				],
			},
			{ version: '6.5.1', expiration: new Date('2024-09-29T18:44:25.719+0000') },
		],
	},
	minimumClientVersions: {
		desktop: '3.9.7',
		mobile: '6.5.0',
	},
};
