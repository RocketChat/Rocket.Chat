import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

export const LoginTerms = (): ReactElement | null => {
	const loginTerms = useSetting('Layout_Login_Terms') as string;

	return loginTerms ? <div dangerouslySetInnerHTML={{ __html: loginTerms }} /> : null;
};

export default LoginTerms;
