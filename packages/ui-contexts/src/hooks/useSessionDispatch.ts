import { useCallback, useContext } from 'react';

import { SessionContext } from '../SessionContext.js';

export const useSessionDispatch = (name: string) => {
	const { dispatch } = useContext(SessionContext);
	return useCallback((value: unknown) => dispatch(name, value), [dispatch, name]);
};
