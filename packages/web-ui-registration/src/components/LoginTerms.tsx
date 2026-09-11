import { Box } from '@rocket.chat/fuselage';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const LoginTerms = () => {
	const { t } = useTranslation();
	const loginTerms = useSetting('Layout_Login_Terms', '');

	const dangerousTerms = useMemo(
		() => ({ __html: loginTerms !== '' ? DOMPurify.sanitize(loginTerms) : DOMPurify.sanitize(t('Layout_Login_Terms_Content')) }),
		[loginTerms, t],
	);

	return (
		<HorizontalWizardLayoutCaption>
			<Box color='default' withRichContent dangerouslySetInnerHTML={dangerousTerms} />
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
