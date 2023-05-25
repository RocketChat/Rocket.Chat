import type { ReactElement } from 'react';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export const LoginTerms = (): ReactElement => {
	const { t } = useTranslation();
	const loginTerms = useSetting('Layout_Login_Terms') as string;

	return (
		<HorizontalWizardLayoutCaption>
			<Box withRichContent dangerouslySetInnerHTML={{ __html: loginTerms !== '' ? loginTerms : t('Layout_Login_Terms_Content') }} />
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
