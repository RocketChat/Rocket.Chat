import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';

export const useErrorHandler = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	return useEffectEvent((error: unknown, defaultMessage?: unknown) => {
		console.error(error);

		dispatchToastMessage({ type: 'error', message: error ?? defaultMessage });
	});
};
