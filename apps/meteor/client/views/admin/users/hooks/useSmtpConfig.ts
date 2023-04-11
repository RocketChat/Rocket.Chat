import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useSmtpConfig = () => {
	const getSmtpConfig = useEndpoint('GET', '/v1/smtp.check');

	const { data } = useQuery(['smtp.check'], async () => {
		const smtpConfig = await getSmtpConfig();

		return smtpConfig.isSMTPConfigured;
	});

	return data;
};
