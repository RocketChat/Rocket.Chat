import { useMethod } from '@rocket.chat/ui-contexts';

export const useLoginSendEmailConfirmation = () => {
	const sendConfirmationEmail = useMethod('sendConfirmationEmail');
	return sendConfirmationEmail;
};
