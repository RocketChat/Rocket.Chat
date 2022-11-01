import { Link } from '@rocket.chat/layout';
import { Trans } from 'react-i18next';
import type { ReactElement } from 'react';
import React from 'react';

export const LoginPoweredBy = (): ReactElement => (
	<Trans i18nKey='registration.page.poweredBy'>
		Powered by
		<Link href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
			Rocket.Chat
		</Link>
	</Trans>
);

export default LoginPoweredBy;
