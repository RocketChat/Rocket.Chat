import { useContext } from 'react';

import { API_COUNT_LIMIT_DEFAULT, ServerContext } from '../ServerContext';

/**
 * How many items to ask a paginated endpoint for.
 *
 * The number is a suggestion. The server clamps `count` down to the workspace's
 * `API_Upper_Count_Limit`, so a page can come back smaller than this — which means the
 * caller must keep paging by what the response actually carried (`count`/`total`) and
 * never by the value returned here.
 */
export const useApiCountLimit = (): number => {
	const { apiCountLimit } = useContext(ServerContext);

	return apiCountLimit ?? API_COUNT_LIMIT_DEFAULT;
};
