import type { FreeSwitchExtension } from '@rocket.chat/core-typings';
import type { StringMap } from 'esl';

import { parseUserStatus } from './parseUserStatus';

export function mapUserData(user: StringMap): FreeSwitchExtension {
	const {
		userid: extension,
		context,
		domain,
		groups,
		contact,
		callgroup: callGroup,
		effective_caller_id_name: callerName,
		effective_caller_id_number: callerNumber,
	} = user;

	if (!extension) {
		throw new Error('Invalid user identification.');
	}

	return {
		extension,
		context,
		domain,
		groups: groups?.split('|') || [],
		status: parseUserStatus(contact),
		contact,
		callGroup,
		callerName,
		callerNumber,
	};
}
