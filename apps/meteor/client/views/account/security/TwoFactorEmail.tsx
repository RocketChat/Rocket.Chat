import { Box, Button, Margins } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../hooks/useEndpointAction';

const TwoFactorEmail = (props: ComponentProps<typeof Box>) => {
	const { t } = useTranslation();
	const user = useUser();

	const isEnabled = user?.services?.email2fa?.enabled;

	const enable2faAction = useEndpointAction('POST', '/v1/users.2fa.enableEmail', {
		successMessage: t('Two-factor_authentication_enabled'),
	});
	const disable2faAction = useEndpointAction('POST', '/v1/users.2fa.disableEmail', {
		successMessage: t('Two-factor_authentication_disabled'),
	});

	const handleEnable = useCallback(async () => {
		await enable2faAction();
	}, [enable2faAction]);
	const handleDisable = useCallback(async () => {
		await disable2faAction();
	}, [disable2faAction]);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbs={16} {...props}>
			<Margins blockEnd={8}>
				<Box fontScale='h4'>{t('Two-factor_authentication_email')}</Box>
				{isEnabled && (
					<Button danger onClick={handleDisable}>
						{t('Disable_two-factor_authentication_email')}
					</Button>
				)}
				{!isEnabled && (
					<>
						<Box>{t('Two-factor_authentication_email_is_currently_disabled')}</Box>
						<Button primary onClick={handleEnable}>
							{t('Enable_two-factor_authentication_email')}
						</Button>
					</>
				)}
			</Margins>
		</Box>
	);
};

export default TwoFactorEmail;
