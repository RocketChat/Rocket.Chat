import { useEndpoint } from '@rocket.chat/ui-contexts';

export const useSendForgotPassword = () => {
	const forgot = useEndpoint('POST', '/v1/users.forgotPassword');

	return forgot;
};
