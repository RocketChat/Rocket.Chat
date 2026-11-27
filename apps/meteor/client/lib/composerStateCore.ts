import { createComposerState, type ComposerStateCore, type ComposerStateCoreParams } from './chats/core/createComposerState';
import { createUploadsAPI } from './chats/uploads';
import { formattingButtons } from './messageBoxFormatting';
import { settings } from './settings';

export type { ComposerStateCore };

export const createComposerStateCore = (params: ComposerStateCoreParams): ComposerStateCore =>
	createComposerState(params, {
		createUploads: (room) => createUploadsAPI(room),
		getFormattingButtons: () => formattingButtons,
		observeSettings: (callback) => settings.observe('*', callback),
	});
