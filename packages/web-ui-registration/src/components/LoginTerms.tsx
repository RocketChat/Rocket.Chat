import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const responsiveTermsStyles = css`
	@media (max-width: 768px) {
		text-align: center;
		font-size: 0.875rem;
		line-height: 1.5;

		a {
			display: inline-block;
			margin: 4px 8px;
		}
	}
`;

export const LoginTerms = (): ReactElement => {
	const { t } = useTranslation();
	const loginTerms = useSetting('Layout_Login_Terms', '');

	return (
		<HorizontalWizardLayoutCaption>
			<Box
				color='default'
				withRichContent
				className={responsiveTermsStyles}
				dangerouslySetInnerHTML={{
					__html: loginTerms !== '' ? DOMPurify.sanitize(loginTerms) : DOMPurify.sanitize(t('Layout_Login_Terms_Content')),
				}}
			/>
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
