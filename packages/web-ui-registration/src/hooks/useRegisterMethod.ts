import { useEndpoint, useRouteParameter, useLoginWithPassword } from '@rocket.chat/ui-contexts';

export const useRegisterMethod = () => {
	const register = useEndpoint('POST', '/v1/users.register');
	const secret = useRouteParameter('hash');

	const login = useLoginWithPassword();
	return async ({ ...props }: Parameters<typeof register>[0]): Promise<ReturnType<typeof register>> => {
		const result = await register({ ...props, secret });
		await login(props.username, props.pass);
		return result;
	};
};
