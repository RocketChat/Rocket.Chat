import { useMethod } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useLoginSendEmailConfirmation = () => {
	return useMutation({
		mutationFn: useMethod('sendConfirmationEmail'),
	});
};
