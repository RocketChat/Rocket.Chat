import type { IFreeSwitchChannelEventMutable, IFreeSwitchChannelEventLegProfile } from '@rocket.chat/core-typings';

/**
 * Returns a soft-copy of the eventData, with the specified data inserted into the profile of the channel's main leg, if it exists.
 * While this returns a new object and the original is not mutated, the result is not a complete hard copy and may still include references to the original
 */
export function insertDataIntoEventProfile(
	channelUniqueId: string,
	eventData: IFreeSwitchChannelEventMutable,
	dataToInsertIntoProfile: Partial<Pick<IFreeSwitchChannelEventLegProfile, 'bridgedTo' | 'callee'>>,
): IFreeSwitchChannelEventMutable {
	const clonedData = {
		...eventData,
		// Clone each leg individually, as we might mutate it
		legs: Object.fromEntries(Object.entries(eventData.legs || {}).map(([key, leg]) => [key, { ...leg }])),
	};

	const leg = clonedData.legs[channelUniqueId];
	if (leg?.profiles && typeof leg.profiles === 'object' && Object.getOwnPropertySymbols(leg.profiles).length === 0) {
		// The raw event can never have more than one profile at the same time, it's only a record because the key for the profile can change between events
		const legProfileKey = Object.keys(leg.profiles).pop();

		if (legProfileKey && leg.profiles[legProfileKey]) {
			leg.profiles[legProfileKey] = {
				...leg.profiles[legProfileKey],
				...dataToInsertIntoProfile,
			};
		}
	}

	return clonedData;
}
