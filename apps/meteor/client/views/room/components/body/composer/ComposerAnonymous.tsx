import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useSessionDispatch, useSetting, useTranslation, useLoginWithToken } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useAnonymousUser } from '../../../../../hooks/useAnonymousUser';

export const ComposerAnonymous = (): ReactElement => {
	const isAnonymousWriteEnabled = useSetting('Accounts_AllowAnonymousWrite');

	const loginWithToken = useLoginWithToken();

	const registerAnonymous = useAnonymousUser();

	const joinAnonymous = async () => {
		await registerAnonymous.mutate(
			{ email: null },
			{
				onSuccess: (result) => {
					loginWithToken(result.token);
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
