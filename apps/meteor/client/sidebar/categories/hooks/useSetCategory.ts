import { useCallback } from 'react';

import { useExperimentalEndpoint } from '../../../hooks/useExperimentalEndpoint';

export const useSetCategory = () => {
	const setCategoryEndpoint = useExperimentalEndpoint('POST', '/experimental/rooms.setCategory');

	return useCallback((roomIds: string[], category: string | null) => setCategoryEndpoint({ roomIds, category }), [setCategoryEndpoint]);
};
