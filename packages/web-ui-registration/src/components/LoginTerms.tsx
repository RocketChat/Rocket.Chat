import type { ReactElement } from 'react';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Box } from '@rocket.chat/fuselage';

export const LoginTerms = (): ReactElement => {
	const loginTerms = useSetting('Layout_Login_Terms') as string;
	return (
		<HorizontalWizardLayoutCaption>
			<Box withRichContent dangerouslySetInnerHTML={{ __html: loginTerms }} />
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
