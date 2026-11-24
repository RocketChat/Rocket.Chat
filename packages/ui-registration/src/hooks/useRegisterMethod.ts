import { useEndpoint, useRouteParameter, useLoginWithPassword } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useRegisterMethod = () => {
	const register = useEndpoint('POST', '/v1/users.register');
	const secret = useRouteParameter('hash');

	const login = useLoginWithPassword();

	return useMutation({
		mutationFn: async ({ ...props }: Parameters<typeof register>[0]): Promise<ReturnType<typeof register>> => {
			const result = await register({ ...props, secret });
			await login(props.username, props.pass);
			return result;
		},
	});
};
