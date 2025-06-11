import type { IFreeSwitchChannelEvent, IFreeSwitchChannelEventLegProfile } from '@rocket.chat/core-typings';
import { convertSubObjectsIntoPaths } from '@rocket.chat/tools';

export function convertEventDataIntoPaths(
	channelUniqueId: string,
	eventData: Omit<
		IFreeSwitchChannelEvent,
		'_id' | 'channelUniqueId' | '_updatedAt' | 'metadata' | 'eventName' | 'sequence' | 'firedAt' | 'receivedAt' | 'callee' | 'caller'
	>,
	dataToInsertIntoProfile: Partial<Pick<IFreeSwitchChannelEventLegProfile, 'bridgedTo' | 'callee'>>,
): Record<string, any> {
	const clonedData = { ...eventData };

	const leg = clonedData.legs?.[channelUniqueId];
	if (leg?.profiles) {
		// The raw event can never have more than one profile at the same time, it's only a record because the key for the profile can change between events
		const legProfileKey = Object.keys(leg.profiles || {}).pop();

		if (legProfileKey && leg.profiles?.[legProfileKey]) {
			leg.profiles[legProfileKey] = {
				...leg.profiles[legProfileKey],
				...dataToInsertIntoProfile,
			};
		}
	}

	return convertSubObjectsIntoPaths(clonedData);
}
