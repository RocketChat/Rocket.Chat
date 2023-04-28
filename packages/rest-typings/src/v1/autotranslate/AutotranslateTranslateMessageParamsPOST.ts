import type { Static } from '../../helpers/schemas';
import { createTypeGuard, type } from '../../helpers/schemas';

const AutotranslateTranslateMessageParamsPostSchema = type.object({
	messageId: type.string(),
	targetLanguage: type.optional(type.string()),
});

export type AutotranslateTranslateMessageParamsPOST = Static<typeof AutotranslateTranslateMessageParamsPostSchema>;

export const isAutotranslateTranslateMessageParamsPOST = createTypeGuard(AutotranslateTranslateMessageParamsPostSchema);
