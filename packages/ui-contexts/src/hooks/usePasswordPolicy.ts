import { useQuery } from '@tanstack/react-query';

import { useEndpoint } from './useEndpoint';

export const usePasswordPolicy = ({ token }: { token?: string }) => {
	const getPasswordPolicy = useEndpoint('GET', '/v1/pw.getPolicy');

	return useQuery(['login', 'password-policy', token], async () => getPasswordPolicy());
};
