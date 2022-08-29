import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const LoginTerms = (): ReactElement => {
	const loginTerms = useSetting('Layout_Login_Terms') as string;

	return <div dangerouslySetInnerHTML={{ __html: loginTerms }} />;
};

export default LoginTerms;
