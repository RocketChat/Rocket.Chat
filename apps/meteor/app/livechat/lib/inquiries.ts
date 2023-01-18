import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';
import type { SortDirection } from 'mongodb';

type ReturnType =
	| {
			priorityWeight: SortDirection;
			ts: SortDirection;
	  }
	| {
			estimatedWaitingTimeQueue: SortDirection;
			ts: SortDirection;
	  }
	| {
			ts: SortDirection;
	  };

export const getOmniChatSortQuery = (
	sortByMechanism: OmnichannelSortingMechanismSettingType = OmnichannelSortingMechanismSettingType.Timestamp,
): ReturnType => {
	switch (sortByMechanism) {
		case OmnichannelSortingMechanismSettingType.Priority:
			return { priorityWeight: 1, ts: 1 };
		case OmnichannelSortingMechanismSettingType.SLAs:
			return { estimatedWaitingTimeQueue: 1, ts: 1 };
		case OmnichannelSortingMechanismSettingType.Timestamp:
		default:
			return { ts: 1 };
	}
};
