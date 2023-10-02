import { t } from '../../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';

const shouldHandleErrorAsWarning = (message: string): boolean => {
	const warnings = ['Could not reach the Marketplace'];

	return warnings.includes(message);
};

export const handleAPIError = (errorObject: unknown): void => {
	const { message = '', error = '' } = errorObject as { message?: string; error?: string };

	if (shouldHandleErrorAsWarning(message)) {
		return dispatchToastMessage({ type: 'warning', message: t(message) });
	}

	dispatchToastMessage({ type: 'error', message: t(`Apps_Error_${error}`) });
};
