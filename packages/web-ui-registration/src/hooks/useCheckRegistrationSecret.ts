import { useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useCheckRegistrationSecret = (hash?: string) => {
	const checkRegistrationSecretURL = useMethod('checkRegistrationSecretURL');

	return useQuery({
		queryKey: ['secretURL', hash],

		queryFn: async () => {
			if (!hash) {
				return false;
			}
			return checkRegistrationSecretURL(hash);
		},
	});
};
