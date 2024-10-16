import type { FreeSwitchExtension } from '@rocket.chat/core-typings';

import type { FreeSwitchOptions } from '../FreeSwitchOptions';
import { runCommand } from '../runCommand';
import { mapUserData } from '../utils/mapUserData';
import { parseUserList } from '../utils/parseUserList';

export function getCommandListFilteredUser(user: string, group = 'default'): string {
	return `list_users group ${group} user ${user}`;
}

export async function getExtensionDetails(
	options: FreeSwitchOptions,
	requestParams: { extension: string; group?: string },
): Promise<FreeSwitchExtension> {
	const { extension, group } = requestParams;
	const response = await runCommand(options, getCommandListFilteredUser(extension, group));

	const users = parseUserList(response);

	if (!users.length) {
		throw new Error('Extension not found.');
	}

	if (users.length >= 2) {
		throw new Error('Multiple extensions were found.');
	}

	return mapUserData(users[0]);
}
