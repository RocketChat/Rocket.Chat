import { Button } from '@rocket.chat/fuselage';
import { useLoginWithPasskey } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoginErrorState, LoginErrors } from './LoginForm';

export type PasskeyLoginButtonProps = {
	disabled?: boolean;
	setError: Dispatch<SetStateAction<LoginErrorState>>;
};

const PasskeyLoginButton = ({ disabled, setError }: PasskeyLoginButtonProps) => {
	const { t } = useTranslation();
	const loginWithPasskey = useLoginWithPasskey();

	const loginMutation = useMutation({
		mutationFn: loginWithPasskey,
		onMutate: () => setError(undefined),
		onError: (error: { error?: LoginErrors; reason?: string }) => {
			if (error.error === 'passkey-canceled') {
				return;
			}

			setError(typeof error.error === 'string' ? [error.error, error.reason] : ['passkey-failed']);
		},
	});

	return (
		<Button icon='key' loading={loginMutation.isPending} disabled={disabled} onClick={() => loginMutation.mutate()}>
			{t('registration.component.login.withPasskey')}
		</Button>
	);
};

export default PasskeyLoginButton;
