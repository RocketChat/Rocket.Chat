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

export const ComposerAnonymous = (): ReactElement => {
	const isAnonymousWriteEnabled = useSetting('Accounts_AllowAnonymousWrite');

	const dispatch = useToastMessageDispatch();

	const loginWithToken = useLoginWithToken();

	const anonymousUser = useMethod('registerUser');

	const registerAnonymous = useMutation({
		mutationFn: async (...params: Parameters<typeof anonymousUser>) => {
			const result = await anonymousUser(...params);
			await loginWithToken(result.token);
			return result;
		},
	});

	const joinAnonymous = async () => {
		await registerAnonymous.mutate(
			{ email: null },
			{
				onError: (error) => {
					dispatch({ type: 'error', message: error });
				},
			},
		);
	};

	const setForceLogin = useSessionDispatch('forceLogin');

	const t = useTranslation();

	return (
		<ButtonGroup marginBlock='x16'>
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
