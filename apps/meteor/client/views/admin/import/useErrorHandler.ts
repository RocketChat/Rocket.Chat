import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';

export const useErrorHandler = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutableCallback((error, defaultMessage) => {
		console.error(error);

		if (typeof error === 'string') {
			dispatchToastMessage({ type: 'error', message: error });
			return;
		}

		const errorType = error?.xhr?.responseJSON?.errorType;

		if (typeof errorType === 'string' && t.has(errorType)) {
			dispatchToastMessage({ type: 'error', message: t(errorType) });
			return;
		}

		if (typeof errorType?.error === 'string' && t.has(errorType.error)) {
			dispatchToastMessage({ type: 'error', message: t(errorType?.error) });
			return;
		}

		if (defaultMessage) {
			dispatchToastMessage({ type: 'error', message: defaultMessage });
		}
	});
};
