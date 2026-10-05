// Workspace packages the standalone client still reads from their built dist: their build does more than compile
// TypeScript (typia transforms, a generated grammar or resources, their own bundlers).
export const distOnlyWorkspacePackages = [
	'@rocket.chat/apps',
	'@rocket.chat/apps-engine',
	'@rocket.chat/core-typings',
	'@rocket.chat/i18n',
	'@rocket.chat/message-parser',
	'@rocket.chat/ui-kit',
];

// Built only for the files public/ links to (the audio recording worker, the voice call popout page).
export const publicAssetWorkspacePackages = ['@rocket.chat/mp3-encoder', '@rocket.chat/ui-voip'];
