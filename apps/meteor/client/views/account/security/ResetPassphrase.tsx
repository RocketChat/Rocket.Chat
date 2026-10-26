import { Button, Stack, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useResetE2EPasswordMutation } from '../../hooks/useResetE2EPasswordMutation';

export const ResetPassphrase = () => {
	const { t } = useTranslation();
	const resetE2EPassword = useResetE2EPasswordMutation();
	return (
		<Stack align='start' gap='x12'>
			<Text is='h4' fontScale='h4'>
				{t('Reset_E2EE_password')}
			</Text>
			<Text is='p' fontScale='p1'>
				{t('Reset_E2EE_password_description')}
			</Text>
			<Button onClick={() => resetE2EPassword.mutate()}>{t('Reset_E2EE_password')}</Button>
		</Stack>
	);
};
