import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import {
	useSessionDispatch,
	useSetting,
	useTranslation,
	useLoginWithToken,
	useToastMessageDispatch,
	useMethod,
} from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';

const ComposerAnonymous = (): ReactElement => {
	const t = useTranslation();
	const dispatch = useToastMessageDispatch();
	const isAnonymousWriteEnabled = useSetting('Accounts_AllowAnonymousWrite');

	const loginWithToken = useLoginWithToken();
	const anonymousUser = useMethod('registerUser');
	const setForceLogin = useSessionDispatch('forceLogin');

	const registerAnonymous = useMutation({
		mutationFn: async (...params: Parameters<typeof anonymousUser>) => {
			const result = await anonymousUser(...params);
			if (typeof result !== 'string' && result.token) {
				await loginWithToken(result.token);
			}
			return result;
		},

		onError: (error) => {
			dispatch({ type: 'error', message: error });
		},
	});

	const joinAnonymous = () => {
		registerAnonymous.mutate({ email: null });
	};

	return (
		<Box mb={16}>
			<ButtonGroup>
				<Button small primary onClick={() => setForceLogin(true)}>
					{t('Sign_in_to_start_talking')}
				</Button>
				{isAnonymousWriteEnabled && (
					<Button small secondary onClick={() => joinAnonymous()}>
						{t('Or_talk_as_anonymous')}
					</Button>
				)}
			</ButtonGroup>
		</Box>
	);
};

export default ComposerAnonymous;
