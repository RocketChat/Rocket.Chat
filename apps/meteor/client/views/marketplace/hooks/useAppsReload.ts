import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { marketplaceQueryKeys } from '../../../lib/queryKeys';

export const useAppsReload = () => {
	const queryClient = useQueryClient();
	return useCallback(() => {
		queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
	}, [queryClient]);
};
