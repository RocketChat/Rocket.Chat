export type CallRole = 'caller' | 'callee';

export function isCallRole(role: string): role is CallRole {
	return ['caller', 'callee'].includes(role);
}
