import { getTimezoneNames } from '@rocket.chat/tools';
import { useMemo } from 'react';

export const useTimezoneNameList = (): string[] =>
	useMemo(() => {
		const names = getTimezoneNames();
		return names.includes('UTC') ? names : ['UTC', ...names];
	}, []);
