// These are the scopes we by default request access to
export const workspaceScopes = [
	'workspace:license:read',
	'workspace:client:write',
	'workspace:stats:write',
	'workspace:push:send',
	'marketplace:read',
	'marketplace:download',
	'fedhub:register',
];

// These are the scopes we use for the user
export const userScopes = ['openid', 'offline_access'];
