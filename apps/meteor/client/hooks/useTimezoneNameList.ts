import { useMemo } from 'react';

const getTimeZoneNames = (): string[] => {
	const intl = Intl as typeof Intl & { supportedValuesOf?(key: 'timeZone'): string[] };
	return typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : [];
};

export const useTimezoneNameList = (): string[] => useMemo(() => getTimeZoneNames(), []);
