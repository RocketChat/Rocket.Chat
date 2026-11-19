import type { ISupportedLanguage } from '@rocket.chat/core-typings';

import type { AutotranslateGetSupportedLanguagesParamsGET } from './autotranslate/AutotranslateGetSupportedLanguagesParamsGET.js';
import type { AutotranslateSaveSettingsParamsPOST } from './autotranslate/AutotranslateSaveSettingsParamsPOST.js';

export type AutoTranslateEndpoints = {
	'/v1/autotranslate.getSupportedLanguages': {
		GET: (params: AutotranslateGetSupportedLanguagesParamsGET) => { languages: ISupportedLanguage[] };
	};
	'/v1/autotranslate.saveSettings': {
		POST: (params: AutotranslateSaveSettingsParamsPOST) => void;
	};
};
