import type { FreeSwitchExtension } from '@rocket.chat/core-typings';

export function parseUserStatus(status: string | undefined): FreeSwitchExtension['status'] {
	if (!status) {
		return 'UNKNOWN';
	}

	if (status === 'error/user_not_registered') {
		return 'UNREGISTERED';
	}

	if (status.startsWith('sofia/')) {
		return 'REGISTERED';
	}

	return 'UNKNOWN';
}
