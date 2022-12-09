import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';
import type { SortDirection } from 'mongodb';

import { settings } from '../../../settings/server';

export const getInquirySortQuery = (
	sortByMechanism: OmnichannelSortingMechanismSettingType,
): Partial<{ [k in keyof ILivechatInquiryRecord]: SortDirection }> => {
	switch (sortByMechanism) {
		case OmnichannelSortingMechanismSettingType.Priority:
			return { priorityWeight: -1, ts: 1 };
		case OmnichannelSortingMechanismSettingType.SLAs:
			return { estimatedServiceTimeAt: 1, ts: 1 };
		case OmnichannelSortingMechanismSettingType.Timestamp:
		default:
			return { ts: -1 };
	}
};

export const getInquirySortMechanism = (): OmnichannelSortingMechanismSettingType =>
	settings.get<OmnichannelSortingMechanismSettingType>('Omnichannel_sorting_mechanism') || OmnichannelSortingMechanismSettingType.Timestamp;
