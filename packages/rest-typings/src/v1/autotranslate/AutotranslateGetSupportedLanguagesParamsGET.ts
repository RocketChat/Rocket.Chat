import type { Static } from '../../helpers/schemas';
import { createTypeGuard, type } from '../../helpers/schemas';

const AutotranslateGetSupportedLanguagesParamsGETSchema = type.object({
	targetLanguage: type.string(),
});

export type AutotranslateGetSupportedLanguagesParamsGET = Static<typeof AutotranslateGetSupportedLanguagesParamsGETSchema>;

export const isAutotranslateGetSupportedLanguagesParamsGET = createTypeGuard(AutotranslateGetSupportedLanguagesParamsGETSchema);
