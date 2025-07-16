import { Box, Field, FieldLabel, FieldRow, Margins, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FormEvent } from 'react';
import { useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../hooks/useEndpointAction';

const TwoFactorEmail = (props: ComponentProps<typeof Box>) => {
	const { t } = useTranslation();
	const user = useUser();
	const emailId = useId();

	const isEnabled = user?.services?.email2fa?.enabled;

	const enable2faAction = useEndpointAction('POST', '/v1/users.2fa.enableEmail', {
		successMessage: t('Two-factor_authentication_enabled'),
	});
	const disable2faAction = useEndpointAction('POST', '/v1/users.2fa.disableEmail', {
		successMessage: t('Two-factor_authentication_disabled'),
	});

	const handleEnable = useCallback(
		async (e: FormEvent<HTMLInputElement>) => {
			if (e.currentTarget.checked) {
				await enable2faAction();
			} else {
				await disable2faAction();
			}
		},
		[disable2faAction, enable2faAction],
	);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbs={16} {...props}>
			<Margins blockEnd={8}>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={emailId}>{t('Two-factor_authentication_email')}</FieldLabel>
						<ToggleSwitch id={emailId} checked={isEnabled} onChange={handleEnable} />
					</FieldRow>
				</Field>
			</Margins>
		</Box>
	);
};

export default TwoFactorEmail;
