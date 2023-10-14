import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useSmtpQuery = () => {
	const getSmtpConfig = useEndpoint('GET', '/v1/smtp.check');
	return useQuery(['smtp.check'], async () => getSmtpConfig());
};
