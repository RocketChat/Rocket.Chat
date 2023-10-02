import { t } from '../../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface ApiError {
	xhr: {
		responseJSON: {
			error: string;
			status: string;
			messages: string[];
			payload?: any;
		};
	};
}

export function handleInstallError(apiError: ApiError | Error): void {
	if (apiError instanceof Error) {
		dispatchToastMessage({ type: 'error', message: apiError.message });
		return;
	}

	if (!apiError.xhr?.responseJSON) {
		return;
	}

	const { status, messages, error, payload = null } = apiError.xhr.responseJSON;

	let message: string;

	switch (status) {
		case 'storage_error':
			message = messages.join('');
			break;
		case 'app_user_error':
			message = messages.join('');
			if (payload?.username) {
				message = t('Apps_User_Already_Exists', { username: payload.username });
			}
			break;
		default:
			if (error) {
				message = error;
			} else {
				message = t('There_has_been_an_error_installing_the_app');
			}
	}

	dispatchToastMessage({ type: 'error', message });
}
