import { useMemo } from 'react';

const getTimeZoneNames = (): string[] => {
	const intl = Intl as typeof Intl & { supportedValuesOf?(key: 'timeZone'): string[] };
	const names = typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : [];
	return names.includes('UTC') ? names : ['UTC', ...names];
};

export const useTimezoneNameList = (): string[] => useMemo(() => getTimeZoneNames(), []);
