import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

export const getInquirySortMechanismSetting = (): OmnichannelSortingMechanismSettingType =>
	settings.get<OmnichannelSortingMechanismSettingType>('Omnichannel_sorting_mechanism') || OmnichannelSortingMechanismSettingType.Timestamp;
