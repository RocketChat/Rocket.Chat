export type ProbeRow = { name: string; loaded: boolean; error?: string };

const firstLine = (error: unknown): string => String((error as { message?: string })?.message ?? error).split('\n')[0];

// String-literal requires so Metro bundles every module statically; each runs in its own try so one failure hides no other.
const loaders: [string, () => unknown][] = [
	['composerState', () => require('../../meteor/client/views/room/composer/lib/composerState')],
	['messageBoxFormatting', () => require('../../meteor/client/lib/messageBoxFormatting')],
	['messageBoxHelpers', () => require('../../meteor/client/views/room/composer/messageBox/messageBoxHelpers')],
	['toggleLinePrefix', () => require('../../meteor/client/lib/toggleLinePrefix')],
	['wrapSelectionText', () => require('../../meteor/client/views/room/composer/messageBox/wrapSelectionText')],
	['composerPopupTrigger', () => require('../../meteor/client/views/room/composer/hooks/composerPopupTrigger')],
	['composerStateCore', () => require('../../meteor/client/lib/composerStateCore')],
	['createComposerAPICore', () => require('../../meteor/client/lib/createComposerAPICore')],
	['sendMessage', () => require('../../meteor/client/lib/chats/flows/sendMessage')],
	['processSlashCommand', () => require('../../meteor/client/lib/chats/flows/processSlashCommand')],
	['processMessageEditing', () => require('../../meteor/client/lib/chats/flows/processMessageEditing')],
	['processTooLongMessage', () => require('../../meteor/client/lib/chats/flows/processTooLongMessage')],
	['chats/data (composeMessage)', () => require('../../meteor/client/lib/chats/data')],
	['uploads', () => require('../../meteor/client/lib/chats/uploads')],
	['uploadFiles', () => require('../../meteor/client/lib/chats/flows/uploadFiles')],
	['UserAction', () => require('../../meteor/client/lib/UserAction')],
	['useDraftStorage (src)', () => require('../../../packages/ui-client/src/hooks/useDraftStorage')],
	['@rocket.chat/ui-client', () => require('@rocket.chat/ui-client')],

	['core/messagePayload', () => require('../../meteor/client/lib/chats/core/messagePayload')],
	['core/createComposerState', () => require('../../meteor/client/lib/chats/core/createComposerState')],
	['core/processSlashCommand', () => require('../../meteor/client/lib/chats/core/processSlashCommand')],
	['core/processTooLongMessage', () => require('../../meteor/client/lib/chats/core/processTooLongMessage')],
	['core/processSetReaction', () => require('../../meteor/client/lib/chats/core/processSetReaction')],
	['core/sendMessage', () => require('../../meteor/client/lib/chats/core/sendMessage')],
];

export const runSharedModulesProbe = (): ProbeRow[] =>
	loaders.map(([name, load]) => {
		try {
			load();
			return { name, loaded: true };
		} catch (error) {
			return { name, loaded: false, error: firstLine(error) };
		}
	});
