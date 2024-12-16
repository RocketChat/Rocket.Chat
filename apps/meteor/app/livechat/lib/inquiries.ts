import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';

type SortOrder = 1 | -1;

type ReturnType =
	| {
			priorityWeight: SortOrder;
			queuedAt: SortOrder;
			ts: SortOrder;
			_updatedAt: SortOrder;
	  }
	| {
			estimatedWaitingTimeQueue: SortOrder;
			queuedAt: SortOrder;
			ts: SortOrder;
			_updatedAt: SortOrder;
	  }
	| {
			queuedAt: SortOrder;
			ts: SortOrder;
			_updatedAt: SortOrder;
	  };

export const getOmniChatSortQuery = (
	sortByMechanism: OmnichannelSortingMechanismSettingType = OmnichannelSortingMechanismSettingType.Timestamp,
): ReturnType => {
	switch (sortByMechanism) {
		case OmnichannelSortingMechanismSettingType.Priority:
			return { priorityWeight: 1, queuedAt: 1, ts: 1, _updatedAt: -1 };
		case OmnichannelSortingMechanismSettingType.SLAs:
			return { estimatedWaitingTimeQueue: 1, queuedAt: 1, ts: 1, _updatedAt: -1 };
		case OmnichannelSortingMechanismSettingType.Timestamp:
		default:
			return { queuedAt: 1, ts: 1, _updatedAt: -1 };
	}
};
