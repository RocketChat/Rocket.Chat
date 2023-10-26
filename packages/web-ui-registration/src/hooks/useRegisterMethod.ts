import { useEndpoint, useRouteParameter, useLoginWithPassword, useRouter } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useRegisterMethod = (isInvite?: boolean) => {
	const register = useEndpoint('POST', '/v1/users.register');
	const secret = useRouteParameter('hash');

	const login = useLoginWithPassword();

	const router = useRouter();

	return useMutation({
		mutationFn: async ({ ...props }: Parameters<typeof register>[0]): Promise<ReturnType<typeof register>> => {
			const result = await register({ ...props, secret });
			await login(props.username, props.pass);

			if (isInvite) {
				router.navigate('/home');
			}

			return result;
		},
	});
};
