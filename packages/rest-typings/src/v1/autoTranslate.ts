import type { IMessage, ISupportedLanguage } from '@rocket.chat/core-typings';

import type { AutotranslateGetSupportedLanguagesParamsGET } from './autotranslate/AutotranslateGetSupportedLanguagesParamsGET';
import type { AutotranslateSaveSettingsParamsPOST } from './autotranslate/AutotranslateSaveSettingsParamsPOST';
import type { AutotranslateTranslateMessageParamsPOST } from './autotranslate/AutotranslateTranslateMessageParamsPOST';

export type AutoTranslateEndpoints = {
	'/v1/autotranslate.getSupportedLanguages': {
		GET: (params: AutotranslateGetSupportedLanguagesParamsGET) => { languages: ISupportedLanguage[] };
	};
	'/v1/autotranslate.saveSettings': {
		POST: (params: AutotranslateSaveSettingsParamsPOST) => void;
	};
	'/v1/autotranslate.translateMessage': {
		POST: (params: AutotranslateTranslateMessageParamsPOST) => {
			message: IMessage;
		};
	};
};
