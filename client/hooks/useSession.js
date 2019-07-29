import { Session } from 'meteor/session';
import { useCallback } from 'react';

import { useReactiveValue } from './useReactiveValue';

export const useSession = (variableName) => {
	const setter = useCallback((newValue) => {
		Session.set(variableName, newValue);
	}, [variableName]);

	const value = useReactiveValue(() => Session.get(variableName));

	return [value, setter];
};
