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
];

const rolesToConsiderAsUser = ['auditor', 'auditor-log'];

export function getMostImportantRole(roles = []) {
	if (!roles.length) {
		return 'no-role';
	}

	roles = roles.map((r) => (rolesToConsiderAsUser.includes(r) ? 'user' : r));

	if (roles.length === 1) {
		if (!order.includes(roles[0])) {
			return 'custom-role';
		}
		return roles[0];
	}

	const newRoles = [];
	for (const role of roles) {
		if (order.includes(role)) {
			newRoles.push(role);
		} else if (!newRoles.includes('custom-role')) {
			newRoles.push('custom-role');
		}
	}

	for (const item of order) {
		if (newRoles.includes(item)) {
			return item;
		}
	}
}
