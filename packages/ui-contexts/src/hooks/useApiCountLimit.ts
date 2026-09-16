import { useContext } from 'react';

import { API_COUNT_LIMIT_DEFAULT, ServerContext } from '../ServerContext';

/** @see ServerContextValue.apiCountLimit */
export const useApiCountLimit = (): number => {
	const { apiCountLimit } = useContext(ServerContext);

	return apiCountLimit ?? API_COUNT_LIMIT_DEFAULT;
};
