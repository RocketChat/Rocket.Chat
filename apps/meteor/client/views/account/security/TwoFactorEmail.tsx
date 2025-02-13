import { Box, Button, Margins } from '@rocket.chat/fuselage';
import { useUser, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../hooks/useEndpointAction';

const TwoFactorEmail = (props: ComponentProps<typeof Box>) => {
	const { t } = useTranslation();
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();

	const [isEmail2faEnabled, setIsEmail2faEnabled] = useState(user?.services?.email2fa?.enabled);
	const [registeringEmail2fa, setRegisteringEmail2fa] = useState(false);

	const enable2faAction = useEndpointAction('POST', '/v1/users.2fa.enableEmail', {
		successMessage: t('Two-factor_authentication_enabled'),
	});
	const disable2faAction = useEndpointAction('POST', '/v1/users.2fa.disableEmail', {
		successMessage: t('Two-factor_authentication_disabled'),
	});

	const handleEnable = useCallback(async () => {
		if (registeringEmail2fa) return;
		setRegisteringEmail2fa(true);

		try {
			await enable2faAction();
			setIsEmail2faEnabled(true);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setRegisteringEmail2fa(false);
		}
	}, [enable2faAction, registeringEmail2fa, dispatchToastMessage, t]);

	const handleDisable = useCallback(async () => {
		if (registeringEmail2fa) return;
		setRegisteringEmail2fa(true);

		try {
			await disable2faAction();
			setIsEmail2faEnabled(false);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setRegisteringEmail2fa(false);
		}
	}, [disable2faAction, registeringEmail2fa, dispatchToastMessage, t]);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbs={16} {...props}>
			<Margins blockEnd={8}>
				<Box fontScale='h4'>{t('Two-factor_authentication_email')}</Box>
				{isEmail2faEnabled ? (
					<Button danger onClick={handleDisable} disabled={registeringEmail2fa}>
						{t('Disable_two-factor_authentication_email')}
					</Button>
				) : (
					<>
						<Box>{t('Two-factor_authentication_email_is_currently_disabled')}</Box>
						<Button primary onClick={handleEnable} disabled={registeringEmail2fa}>
							{t('Enable_two-factor_authentication_email')}
						</Button>
					</>
				)}
			</Margins>
		</Box>
	);
};

export default TwoFactorEmail;
