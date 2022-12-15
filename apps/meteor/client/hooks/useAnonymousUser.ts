import { useMethod } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useAnonymousUser = () => {
	const anonymousUser = useMethod('registerUser');
	return useMutation({
		mutationFn: anonymousUser,
	});
};
