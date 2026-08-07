import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useCheckRegistrationSecret = (hash?: string) => {
	const checkRegistrationSecretURL = useEndpoint('GET', '/v1/misc.registrationSecretCheck');

	return useQuery({
		queryKey: ['secretURL', hash],

		queryFn: async () => {
			if (!hash) {
				return false;
			}
			const { valid } = await checkRegistrationSecretURL({ hash });
			return valid;
		},
	});
};
