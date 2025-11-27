import { useMethod } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useLoginSendEmailConfirmation = () => useMutation({
		mutationFn: useMethod('sendConfirmationEmail'),
	});
