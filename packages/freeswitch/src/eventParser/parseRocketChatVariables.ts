import type { IFreeSwitchEventCallUser, IFreeSwitchEventRocketChatVariable } from '@rocket.chat/core-typings';

import { insertDataIntoExistingUsers } from './insertDataIntoExistingUsers';
import { makeEventCallUser } from './makeEventCallUser';
import { makeEventUser } from './makeEventUser';

export function parseRocketChatVariables(
	eventData: Record<string, string>,
	list: IFreeSwitchEventCallUser[],
): Record<string, IFreeSwitchEventRocketChatVariable | undefined> {
	const rocketChatVariables = Object.fromEntries(
		Object.keys(eventData)
			.filter((key) => key.includes('X-RocketChat-User-') && Boolean(eventData[key]))
			.map((key) => [key.split('X-RocketChat-User-')[1], eventData[key]]),
	) as Record<string, string>;

	const parsedVariables: Record<string, IFreeSwitchEventRocketChatVariable | undefined> = {};

	for (const [key, serializedData] of Object.entries(rocketChatVariables)) {
		try {
			const userData = JSON.parse(serializedData) as IFreeSwitchEventRocketChatVariable | undefined;
			parsedVariables[key] = userData;

			if (!userData?.userId) {
				continue;
			}

			const user = makeEventCallUser([makeEventUser('extension', userData.extension), makeEventUser('contact', userData.contact)], {
				uid: userData.userId,
				workspaceUrl: userData.workspaceUrl,
				reached: true,
			});

			if (!user) {
				continue;
			}
			insertDataIntoExistingUsers(user, list);

			if (userData.workspaceUrl && userData.calleeExtension) {
				const callee = makeEventCallUser([makeEventUser('extension', userData.calleeExtension)], {
					presumedWorkspaceUrl: userData.workspaceUrl,
				});
				if (callee) {
					insertDataIntoExistingUsers(callee, list);
				}
			}
		} catch {
			//
		}
	}

	return parsedVariables;
}
