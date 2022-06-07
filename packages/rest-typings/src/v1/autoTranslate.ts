import type { ISupportedLanguage } from '@rocket.chat/core-typings';

export type AutoTranslateEndpoints = {
	'autotranslate.getSupportedLanguages': {
		GET: (params: { targetLanguage: string }) => { languages: ISupportedLanguage[] };
	};
	'autotranslate.saveSettings': {
		POST: (params: { roomId: string; field: string; value: boolean; defaultLanguage?: string }) => void;
	};
	'autotranslate.translateMessage': {
		POST: (params: { messageId: string; targetLanguage?: string }) => void;
	};
};
