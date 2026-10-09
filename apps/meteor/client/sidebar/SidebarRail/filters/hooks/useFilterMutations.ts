import { useMutation } from '@tanstack/react-query';

import { useErrorToast } from './useErrorToast';
import { useExperimentalEndpoint } from '../../../../hooks/useExperimentalEndpoint';

export const useCreateFilter = () => {
	const createFilter = useExperimentalEndpoint('POST', '/experimental/sidebarFilters.create');
	const onError = useErrorToast();

	return useMutation({ mutationFn: createFilter, onError });
};

export const useUpdateFilter = () => {
	const updateFilter = useExperimentalEndpoint('POST', '/experimental/sidebarFilters.update');
	const onError = useErrorToast();

	return useMutation({ mutationFn: updateFilter, onError });
};

export const useDeleteFilter = () => {
	const deleteFilter = useExperimentalEndpoint('POST', '/experimental/sidebarFilters.delete');
	const onError = useErrorToast();

	return useMutation({ mutationFn: deleteFilter, onError });
};

export const useDuplicateFilter = () => {
	const duplicateFilter = useExperimentalEndpoint('POST', '/experimental/sidebarFilters.duplicate');
	const onError = useErrorToast();

	return useMutation({ mutationFn: duplicateFilter, onError });
};

export const useReorderFilters = () => {
	const reorderFilters = useExperimentalEndpoint('POST', '/experimental/sidebarFilters.reorder');
	const onError = useErrorToast();

	return useMutation({ mutationFn: reorderFilters, onError });
};

export const useSetFiltersDisplay = () => {
	const setDisplayPreferences = useExperimentalEndpoint('POST', '/experimental/sidebarFilters.setDisplayPreferences');
	const onError = useErrorToast();

	return useMutation({ mutationFn: setDisplayPreferences, onError });
};
