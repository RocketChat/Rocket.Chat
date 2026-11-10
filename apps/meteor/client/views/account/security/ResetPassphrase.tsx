import { Button, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import SecuritySection from './layout/SecuritySection';
import { useResetE2EPasswordMutation } from '../../hooks/useResetE2EPasswordMutation';

export const ResetPassphrase = () => {
	const { t } = useTranslation();
	const resetE2EPassword = useResetE2EPasswordMutation();
	return (
		<SecuritySection title={t('Reset_E2EE_password')} headingLevel='h4' fitContent>
			<Text is='p' fontScale='p1'>
				{t('Reset_E2EE_password_description')}
			</Text>
			<Button onClick={() => resetE2EPassword.mutate()}>{t('Reset_E2EE_password')}</Button>
		</SecuritySection>
	);
};
