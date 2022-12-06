import { Box, Button, Margins } from '@rocket.chat/fuselage';
import { useUser, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { useCallback } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';

const TwoFactorEmail = (props: ComponentProps<typeof Box>): ReactElement => {
	const t = useTranslation();
	const user = useUser();

	const isEnabled = user?.services?.email2fa?.enabled;

	const enable2faAction = useEndpointAction('POST', '/v1/users.2fa.enableEmail', undefined, t('Two-factor_authentication_enabled'));
	const disable2faAction = useEndpointAction('POST', '/v1/users.2fa.disableEmail', undefined, t('Two-factor_authentication_disabled'));

	const handleEnable = useCallback(async () => {
		await enable2faAction();
	}, [enable2faAction]);
	const handleDisable = useCallback(async () => {
		await disable2faAction();
	}, [disable2faAction]);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbs='x16' {...props}>
			<Margins blockEnd='x8'>
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
