import { Button, ButtonGroup } from '@rocket.chat/fuselage';
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
import React from 'react';

const ComposerAnonymous = (): ReactElement => {
	const isAnonymousWriteEnabled = useSetting('Accounts_AllowAnonymousWrite');

	const dispatch = useToastMessageDispatch();

	const loginWithToken = useLoginWithToken();

	const anonymousUser = useMethod('registerUser');

	const registerAnonymous = useMutation(
		async (...params: Parameters<typeof anonymousUser>) => {
			const result = await anonymousUser(...params);
			if (typeof result !== 'string' && result.token) {
				await loginWithToken(result.token);
			}
			return result;
		},
		{
			onError: (error) => {
				dispatch({ type: 'error', message: error });
			},
		},
	);

	const joinAnonymous = () => {
		registerAnonymous.mutate({ email: null });
	};

	const setForceLogin = useSessionDispatch('forceLogin');

	const t = useTranslation();

	return (
		<ButtonGroup marginBlock={16}>
			<Button small primary onClick={() => setForceLogin(true)}>
				{t('Sign_in_to_start_talking')}
			</Button>
			{isAnonymousWriteEnabled && (
				<Button small secondary onClick={() => joinAnonymous()}>
					{t('Or_talk_as_anonymous')}
				</Button>
			)}
		</ButtonGroup>
	);
};

export default ComposerAnonymous;
