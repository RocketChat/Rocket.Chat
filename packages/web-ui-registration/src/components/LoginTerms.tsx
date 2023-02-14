import { Trans } from 'react-i18next';
import type { ReactElement } from 'react';
import { Link, HorizontalWizardLayoutCaption } from '@rocket.chat/layout';

export const LoginTerms = (): ReactElement => {
	return (
		<HorizontalWizardLayoutCaption>
			<Trans
				defaults='By proceeding you are agreeing to our <0>{{terms}}</0>, <1>{{privacyPolicy}}</1> and <2>{{legalNotice}}</2>.'
				values={{ terms: 'Terms of Service', privacyPolicy: 'Privacy Policy', legalNotice: 'Legal Notice' }}
				components={[<Link href='/terms-of-service' />, <Link href='/privacy-policy' />, <Link href='/legal-notice' />]}
			/>
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
