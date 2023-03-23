import { dispatchToastMessage } from '../../../../lib/toast';

const shouldHandleErrorAsWarning = (message: string): boolean => {
	const warnings = ['Could not reach the Marketplace'];

	return warnings.includes(message);
};

const handleAPIError = (error: unknown): void => {
	if (error instanceof Error) {
		const { message } = error;

		if (shouldHandleErrorAsWarning(message)) {
			dispatchToastMessage({ type: 'warning', message });
			return;
		}

		dispatchToastMessage({ type: 'error', message });
	}
};

export default handleAPIError;
