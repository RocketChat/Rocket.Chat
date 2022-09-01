import { useEndpoint, useRouteParameter } from '@rocket.chat/ui-contexts';

export const useRegisterMethod = () => {
	const register = useEndpoint('POST', '/v1/users.register');
	const secret = useRouteParameter('hash');

	return ({ ...props }: Parameters<typeof register>[0]): ReturnType<typeof register> => register({ ...props, secret });
};
