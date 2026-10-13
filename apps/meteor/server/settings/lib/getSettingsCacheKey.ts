import { createHash } from 'node:crypto';

import { EnterpriseSettings } from '@rocket.chat/core-services';

export const getSettingsCacheKey = async (): Promise<string> => {
	const parts = [await EnterpriseSettings.getCacheKeyPart()];

	return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 16);
};
