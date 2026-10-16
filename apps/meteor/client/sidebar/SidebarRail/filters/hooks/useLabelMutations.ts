import { useMutation } from '@tanstack/react-query';

import { useErrorToast } from './useErrorToast';
import { useExperimentalEndpoint } from '../../../../hooks/useExperimentalEndpoint';

export const useCreateLabel = () => {
	const createLabel = useExperimentalEndpoint('POST', '/experimental/subscriptionLabels.create');
	const onError = useErrorToast();

	return useMutation({ mutationFn: createLabel, onError });
};

export const useUpdateLabel = () => {
	const updateLabel = useExperimentalEndpoint('POST', '/experimental/subscriptionLabels.update');
	const onError = useErrorToast();

	return useMutation({ mutationFn: updateLabel, onError });
};

export const useDeleteLabel = () => {
	const deleteLabel = useExperimentalEndpoint('POST', '/experimental/subscriptionLabels.delete');
	const onError = useErrorToast();

	return useMutation({ mutationFn: deleteLabel, onError });
};

export const useSetSubscriptionLabels = () => {
	const setLabels = useExperimentalEndpoint('POST', '/experimental/subscriptions.setLabels');
	const onError = useErrorToast();

	return useMutation({ mutationFn: setLabels, onError });
};
