import type { ReactElement } from 'react';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export const LoginTerms = (): ReactElement => {
	const { t } = useTranslation();
	const loginTerms = useSetting('Layout_Login_Terms') as string;
	const loginTermsDefault =
		'By proceeding you are agreeing to our <a href="terms-of-service">Terms of Service</a>, <a href="privacy-policy">Privacy Policy</a> and <a href="legal-notice">Legal Notice</a>.';

	return (
		<HorizontalWizardLayoutCaption>
			<Box
				withRichContent
				dangerouslySetInnerHTML={{ __html: loginTerms !== loginTermsDefault ? loginTerms : t('Layout_Login_Terms_Content') }}
			/>
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
