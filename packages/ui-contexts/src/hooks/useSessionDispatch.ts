import { useCallback, useContext } from 'react';

import { SessionContext } from '../SessionContext';

export const useSessionDispatch = (name: string): ((value: unknown) => void) => {
	const { dispatch } = useContext(SessionContext);
	return useCallback((value) => dispatch(name, value), [dispatch, name]);
};
