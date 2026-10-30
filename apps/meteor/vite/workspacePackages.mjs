// Workspace packages the standalone client still reads from their built dist: their build does more than compile
// TypeScript (typia transforms, a generated grammar or resources, their own bundlers).
export const distOnlyWorkspacePackages = [
	'@rocket.chat/apps',
	'@rocket.chat/apps-engine',
	'@rocket.chat/core-typings',
	'@rocket.chat/fuselage',
	'@rocket.chat/fuselage-tokens',
	'@rocket.chat/i18n',
	'@rocket.chat/message-parser',
	'@rocket.chat/ui-kit',
];

// These builds provide the targets of public asset links.
export const publicAssetWorkspacePackages = ['@rocket.chat/e2ee-search-worker', '@rocket.chat/mp3-encoder', '@rocket.chat/ui-voip'];
