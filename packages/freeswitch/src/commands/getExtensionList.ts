import type { FreeSwitchExtension } from '@rocket.chat/core-typings';

import type { FreeSwitchOptions } from '../FreeSwitchOptions';
import { runCommand } from '../runCommand';
import { mapUserData } from '../utils/mapUserData';
import { parseUserList } from '../utils/parseUserList';

export function getCommandListUsers(): string {
	return 'list_users';
}

export async function getExtensionList(options: FreeSwitchOptions): Promise<FreeSwitchExtension[]> {
	const response = await runCommand(options, getCommandListUsers());
	const users = parseUserList(response);

	return users.map((item) => mapUserData(item));
}
