import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useSendTelemetryMutation = () => {
	const sendTelemetry = useEndpoint('POST', '/v1/statistics.telemetry');

	return useMutation(sendTelemetry, {
		onError: (error) => {
			console.warn(error);
		},
	});
};
