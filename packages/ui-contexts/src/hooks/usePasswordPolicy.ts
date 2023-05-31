import { useQuery } from '@tanstack/react-query';

import { useEndpoint } from './useEndpoint';

export const usePasswordPolicy = ({ token }: { token?: string }) => {
	const getPasswordPolicy = useEndpoint('GET', '/v1/pw.getPolicy');
	const getPasswordPolicyRest = useEndpoint('GET', '/v1/pw.getPolicyReset');

	return useQuery(['login', 'password-policy', token], async () => (!token ? getPasswordPolicy() : getPasswordPolicyRest({ token })));
};
