import React, { ReactElement } from 'react';

import BlazeTemplate from '../BlazeTemplate';
import { useIframeLogin } from './useIframeLogin';

const LoginPage = (): ReactElement => {
	const iframeLoginUrl = useIframeLogin();

	if (iframeLoginUrl) {
		return <iframe src={iframeLoginUrl} style={{ height: '100%', width: '100%' }} />;
	}

	return <BlazeTemplate template='loginLayout' />;
};

export default LoginPage;
