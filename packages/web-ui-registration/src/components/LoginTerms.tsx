import { Box } from '@rocket.chat/fuselage';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export const LoginTerms = (): ReactElement => {
	const { t } = useTranslation();
	const loginTerms = useSetting('Layout_Login_Terms', '');

	return (
		<HorizontalWizardLayoutCaption>
			<Box
				withRichContent
				dangerouslySetInnerHTML={{
					__html: loginTerms !== '' ? DOMPurify.sanitize(loginTerms) : DOMPurify.sanitize(t('Layout_Login_Terms_Content')),
				}}
			/>
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
