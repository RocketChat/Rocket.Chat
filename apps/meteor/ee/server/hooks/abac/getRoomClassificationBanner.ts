import { buildRoomClassificationBanner, parseClassificationBannersConfig } from '@rocket.chat/abac';
import { License } from '@rocket.chat/license';

import { getRoomClassificationBanner } from '../../../../server/api/lib/getRoomClassificationBanner';
import { settings } from '../../../../server/settings';

getRoomClassificationBanner.patch(async (next, room) => {
	if (
		!License.hasModule('abac') ||
		!settings.get<boolean>('ABAC_Enabled') ||
		!settings.get<boolean>('ABAC_Classification_Banners_Enabled')
	) {
		return next(room);
	}

	const config = parseClassificationBannersConfig(settings.get<string>('ABAC_Classification_Banners_Config'));
	return config?.enabled ? buildRoomClassificationBanner(config, room) : undefined;
});
