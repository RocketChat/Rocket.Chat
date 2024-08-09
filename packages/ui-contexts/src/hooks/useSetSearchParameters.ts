import { useContext, useCallback } from 'react';

import type { LocationPathname } from '../RouterContext';
import { RouterContext } from '../RouterContext';

export const useSetSearchParameters = () => {
	const { navigate, getSearchParameters } = useContext(RouterContext);

	return useCallback(
		(newParams) => {
			const currentParams = getSearchParameters();
			const updatedParams = { ...currentParams, ...newParams };

			Object.keys(updatedParams).forEach((key) => {
				if (updatedParams[key] === null || updatedParams[key] === undefined) {
					delete updatedParams[key];
				}
			});

			const { pathname } = window.location ;

			navigate(
				{
					pathname: pathname as LocationPathname,
					search: updatedParams,
				},
				{ replace: true },
			);
		},
		[navigate, getSearchParameters],
	);
};
