function ensureStringArray(value: string | string[] | undefined): string[] {
	if (!value) {
		return [];
	}

	if (typeof value === 'string') {
		return [value];
	}

	if (Array.isArray(value)) {
		return value;
	}

	return [];
}

function normalizeDeviceId(deviceId: ConstrainDOMString | null): { exact: string[]; ideal: string[] } {
	if (!deviceId) {
		return {
			exact: [],
			ideal: [],
		};
	}

	if (typeof deviceId === 'object' && !Array.isArray(deviceId)) {
		return {
			exact: ensureStringArray(deviceId.exact),
			ideal: ensureStringArray(deviceId.ideal),
		};
	}

	return {
		exact: [],
		ideal: ensureStringArray(deviceId),
	};
}

function isSameStringArray(array1: string[], array2: string[]): boolean {
	const uniqueArray1 = [...new Set(array1)];
	const uniqueArray2 = [...new Set(array2)];

	if (uniqueArray1.length !== uniqueArray2.length) {
		return false;
	}

	for (const value of uniqueArray1) {
		if (!uniqueArray2.includes(value)) {
			return false;
		}
	}

	return true;
}

export function isSameDeviceId(deviceId1: ConstrainDOMString | null, deviceId2: ConstrainDOMString | null): boolean {
	if (deviceId1 === deviceId2 || (!deviceId1 && !deviceId2)) {
		return true;
	}

	const normalizedDeviceId1 = normalizeDeviceId(deviceId1);
	const normalizedDeviceId2 = normalizeDeviceId(deviceId2);

	if (!isSameStringArray(normalizedDeviceId1.exact, normalizedDeviceId2.exact)) {
		return false;
	}
	if (!isSameStringArray(normalizedDeviceId1.ideal, normalizedDeviceId2.ideal)) {
		return false;
	}

	return true;
}
