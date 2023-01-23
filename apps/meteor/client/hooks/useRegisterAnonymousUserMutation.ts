import { useMethod } from '@rocket.chat/ui-contexts';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

type UseRegisterAnonymousUserMutationVariables = {
	email: string | null;
};

export const useRegisterAnonymousUserMutation = (): UseMutationResult<
	{ token: string },
	Error,
	UseRegisterAnonymousUserMutationVariables
> => {
	const anonymousUser = useMethod('registerUser');
	return useMutation({
		mutationFn: anonymousUser,
	});
};
