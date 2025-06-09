export function extractChannelChangesFromEvent(
	channelState: Record<string, any>,
	eventName: string,
	eventValues: Record<string, any>,
): {
	changedValues: Record<string, any>;
	newValues: Record<string, any>;
	changedExistingValues: Record<string, { oldValue: any; newValue: any; delta?: number }>;
} {
	const changedValues: Record<string, any> = {};
	const newValues: Record<string, any> = {};
	const changedExistingValues: Record<string, any> = {};

	const getValues = (key: string): { oldValue: any; newValue: any } => {
		const oldValue = channelState[key];
		const newValue = eventValues[key];

		// The bridgeUniqueIds attribute only exists on CHANNEL_BRIDGE and CHANNEL_UNBRIDGE events, and all bridges IDs are received on both
		// So instead of treating it as the current value of the attribute, let's treat the values from the UNBRIDGE event as a removal
		if (key !== 'bridgeUniqueIds' || eventName !== 'CHANNEL_UNBRIDGE') {
			return { oldValue, newValue };
		}

		if (!Array.isArray(oldValue) || !Array.isArray(newValue)) {
			return { oldValue, newValue };
		}

		const modifiedValue = oldValue.filter((value: any) => !newValue.includes(value));
		return { oldValue, newValue: modifiedValue };
	};

	for (const key in eventValues) {
		if (!(key in eventValues)) {
			continue;
		}

		const { oldValue, newValue } = getValues(key);

		if (newValue === undefined || oldValue === newValue) {
			continue;
		}

		const isDate = typeof newValue === 'object' && newValue instanceof Date && typeof oldValue === 'object' && oldValue instanceof Date;

		if (isDate && newValue.toISOString() === oldValue.toISOString()) {
			continue;
		}

		if (Array.isArray(oldValue) || Array.isArray(newValue)) {
			const oldList = Array.isArray(oldValue) ? oldValue : [oldValue];
			const newList = Array.isArray(newValue) ? newValue : [newValue];

			const isEqual = !oldList.some((item) => !newList.includes(item)) && !newList.some((item) => !oldList.includes(item));

			if (key.startsWith('variables.') && isEqual) {
				continue;
			}
		}

		if (oldValue === undefined) {
			newValues[key] = newValue;
		} else {
			changedExistingValues[key] = {
				oldValue,
				newValue,
				...(isDate && { delta: newValue.valueOf() - oldValue.valueOf() }),
			};
		}

		changedValues[key] = newValue;
	}

	return { changedValues, newValues, changedExistingValues };
}
