import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { RouterContext } from '../RouterContext';

export const useQueryStringParameter = (name: string): string | undefined => {
	const { queryQueryStringParameter } = useContext(RouterContext);

	return useSubscription(useMemo(() => queryQueryStringParameter(name), [queryQueryStringParameter, name]));
};
