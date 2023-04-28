import type { Static } from '../../helpers/schemas';
import { createTypeGuard, type } from '../../helpers/schemas';

const AutotranslateSaveSettingsParamsPostSchema = type.object({
	roomId: type.string(),
	field: type.union([type.literal('autoTranslate'), type.literal('autoTranslateLanguage')]),
	value: type.union([type.boolean(), type.string()]),
	defaultLanguage: type.optional(type.string()),
});

export type AutotranslateSaveSettingsParamsPOST = Static<typeof AutotranslateSaveSettingsParamsPostSchema>;

export const isAutotranslateSaveSettingsParamsPOST = createTypeGuard(AutotranslateSaveSettingsParamsPostSchema);
