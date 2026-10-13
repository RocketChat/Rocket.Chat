import { buildClassificationBanner, parseClassificationBannersConfig } from '@rocket.chat/abac';
import { License } from '@rocket.chat/license';

import { getRoomClassificationBanner } from '../../../../server/api/lib/getRoomClassificationBanner';
import { isABACManagedRoom } from '../../../../server/lib/authorization/isABACManagedRoom';
import { settings } from '../../../../server/settings';

getRoomClassificationBanner.patch(async (next, room) => {
	if (!License.hasModule('abac') || !settings.get<boolean>('ABAC_Classification_Banners_Enabled') || !isABACManagedRoom(room)) {
		return next(room);
	}

	const config = parseClassificationBannersConfig(settings.get<string>('ABAC_Classification_Banners_Config'));
	return config?.enabled ? buildClassificationBanner(config, room.abacAttributes ?? []) : undefined;
});
