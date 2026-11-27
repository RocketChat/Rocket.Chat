import { createComposerState, type ComposerStateCore, type ComposerStateCoreParams } from './chats/core/createComposerState';
import { createUploadsAPI } from './chats/uploads';
import { formattingButtons } from './messageBoxFormatting';
import { settings } from './settings';

export type { ComposerStateCore };

export const createComposerStateCore = (params: ComposerStateCoreParams): ComposerStateCore =>
	createComposerState(params, {
		createUploads: (room) => createUploadsAPI(room),
		getFormattingButtons: () => formattingButtons,
		// Coarse-grained: fires on every setting change, but the only condition()
		// today is Katex_Enabled and the recompute is a cheap zustand read, so the
		// extra work per unrelated setting change is negligible.
		observeSettings: (callback) => settings.observe('*', callback),
	});
