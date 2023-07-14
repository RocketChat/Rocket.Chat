import React from 'react';

import { appLayout } from '../../lib/appLayout';
import MainLayout from '../../views/root/MainLayout';
import { useRouteDefinition, type UseRouteDefinitionOptions } from './useRouteDefinition';

export const useMainRouteDefinition = ({ enabled = true, element, ...route }: UseRouteDefinitionOptions) => {
	return useRouteDefinition({
		enabled,
		...route,
		element: appLayout.wrap(<MainLayout>{element}</MainLayout>),
	});
};
