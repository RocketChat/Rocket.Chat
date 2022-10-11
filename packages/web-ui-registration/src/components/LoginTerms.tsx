import { Trans } from 'react-i18next';
// import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Link, HorizontalWizardLayoutCaption } from '@rocket.chat/layout';

export const LoginTerms = (): ReactElement | null => {
	// const loginTerms = useSetting('Layout_Login_Terms') as string;

	return (
		<HorizontalWizardLayoutCaption>
			<Trans
				defaults='By proceeding you are agreeing to our <0>{{terms}}</0>, <1>{{privacyPolicy}}</1> and <2>{{legalNotice}}</2>.'
				values={{ terms: 'Terms of Service', privacyPolicy: 'Privacy Policy', legalNotice: 'Legal Notice' }}
				components={[<Link href='/terms-of-service' />, <Link href='/privacy-policy' />, <Link href='/legal-notice' />]}
			/>
			{/* <div dangerouslySetInnerHTML={{ __html: loginTerms }} /> */}
		</HorizontalWizardLayoutCaption>
	);
	// return loginTerms ? <div dangerouslySetInnerHTML={{ __html: loginTerms }} /> : null;
};
// {
// 	/* <a href="terms-of-service">Terms of Service</a>
// <a href="privacy-policy">Privacy Policy</a> */
// 	{
// 		/* <a href="legal-notice">Legal Notice</a> */
// 	}
// }

export default LoginTerms;
