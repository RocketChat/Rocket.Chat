import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';
import type { SortDirection } from 'mongodb';

export const getInquirySortQuery = (
	sortByMechanism: OmnichannelSortingMechanismSettingType = OmnichannelSortingMechanismSettingType.Timestamp,
): Partial<{ [k in keyof ILivechatInquiryRecord]: SortDirection }> => {
	switch (sortByMechanism) {
		case OmnichannelSortingMechanismSettingType.Priority:
			return { priorityWeight: 1, estimatedWaitingTimeQueue: 1, estimatedServiceTimeAt: 1, ts: 1 }; // TODO: update indexes
		case OmnichannelSortingMechanismSettingType.SLAs:
			return { estimatedWaitingTimeQueue: 1, estimatedServiceTimeAt: 1, priorityWeight: 1, ts: 1 };
		case OmnichannelSortingMechanismSettingType.Timestamp:
		default:
			return { ts: 1 };
	}
};
