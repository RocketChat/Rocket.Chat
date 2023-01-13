import type { IGrandfatherLicense } from '@rocket.chat/core-typings';
import { GrandfatherLicense } from '@rocket.chat/models';

export const isFeatureQualifiedForGrandfathering = async (feature: IGrandfatherLicense['allowedModule']): Promise<boolean> => {
	const record = await GrandfatherLicense.findOne({
		allowedModule: feature,
	});

	return !!record;
};
