import type { ISupportedLanguage } from '@rocket.chat/core-typings';

export type AutoTranslateEndpoints = {
	'/v1/autotranslate.getSupportedLanguages': {
		GET: (params: { targetLanguage: string }) => { languages: ISupportedLanguage[] };
	};
	'/v1/autotranslate.saveSettings': {
		POST: (params: { roomId: string; field: string; value: boolean; defaultLanguage?: string }) => void;
	};
	'/v1/autotranslate.translateMessage': {
		POST: (params: { messageId: string; targetLanguage?: string }) => void;
	};
};
