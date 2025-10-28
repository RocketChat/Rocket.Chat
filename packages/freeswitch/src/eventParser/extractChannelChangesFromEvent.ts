// Make an object with a list of changes from the previous accumulated channel state and the state of the next event
export function extractChannelChangesFromEvent(
	channelState: Record<string, any>,
	_eventName: string,
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

		if (key !== 'bridgeUniqueIds') {
			return { oldValue, newValue };
		}

		// For the bridgeUniqueIds field specifically, only add new values, never remove
		const oldList = Array.isArray(oldValue) ? oldValue : [oldValue];
		const newList = Array.isArray(newValue) ? newValue : [newValue];
		const fullList = [...new Set<string>([...oldList, ...newList])].filter((id) => id);

		return { oldValue, newValue: fullList };
	};

	for (const key of Object.keys(eventValues)) {
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
			if (key === 'bridgeUniqueIds' && newList.length <= oldList.length) {
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
