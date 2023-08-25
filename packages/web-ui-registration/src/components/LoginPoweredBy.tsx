import { Box } from '@rocket.chat/fuselage';
import { Link } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

export const LoginPoweredBy = (): ReactElement | null => {
	const hidePoweredBy = useSetting<boolean>('Layout_Login_Hide_Powered_By');
	if (hidePoweredBy) {
		return null;
	}
	return (
		<Box mbe={18}>
			<Trans i18nKey='registration.page.poweredBy'>
				{'Powered by '}
				<Link href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
					Rocket.Chat
				</Link>
			</Trans>
		</Box>
	);
};

export default LoginPoweredBy;
