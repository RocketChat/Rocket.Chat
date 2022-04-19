import type { IRole } from '@rocket.chat/core-typings';

type PriorityRoleName =
	| 'custom-role'
	| 'admin'
	| 'livechat-manager'
	| 'livechat-monitor'
	| 'livechat-agent'
	| 'user'
	| 'app'
	| 'bot'
	| 'guest'
	| 'anonymous';

const order = [
	'admin',
	'livechat-manager',
	'livechat-monitor',
	'livechat-agent',
	'custom-role',
	'user',
	'app',
	'bot',
	'guest',
	'anonymous',
] as const;

const rolesToConsiderAsUser = ['auditor', 'auditor-log'];

export function getMostImportantRole(roles: IRole['_id'][] = []): 'no-role' | PriorityRoleName {
	if (!roles.length) {
		return 'no-role';
	}

	roles = roles.map((r) => (rolesToConsiderAsUser.includes(r) ? 'user' : r));

	if (roles.length === 1) {
		if (!(order as readonly string[]).includes(roles[0])) {
			return 'custom-role';
		}
		return roles[0] as PriorityRoleName;
	}

	const newRoles: PriorityRoleName[] = [];
	for (const role of roles) {
		if ((order as readonly string[]).includes(role)) {
			newRoles.push(role as PriorityRoleName);
		} else if (!newRoles.includes('custom-role')) {
			newRoles.push('custom-role');
		}
	}

	for (const item of order) {
		if (newRoles.includes(item)) {
			return item;
		}
	}

	return 'no-role';
}
