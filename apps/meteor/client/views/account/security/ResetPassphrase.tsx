import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useResetE2EPasswordMutation } from '../../hooks/useResetE2EPasswordMutation';

export const ResetPassphrase = (): JSX.Element => {
	const { t } = useTranslation();
	const resetE2EPassword = useResetE2EPasswordMutation();
	return (
		<>
			<Box is='h4' fontScale='h4' mbe={12}>
				{t('Reset_E2EE_password')}
			</Box>
			<Box is='p' fontScale='p1' mbe={12}>
				{t('Reset_E2EE_password_description')}
			</Box>
			<Button onClick={() => resetE2EPassword.mutate()}>{t('Reset_E2EE_password')}</Button>
		</>
	);
};
