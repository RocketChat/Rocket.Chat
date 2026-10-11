import { Box, Margins } from '@rocket.chat/fuselage';
import { BackgroundLayer, LayoutLogo } from '@rocket.chat/layout';
import { Trans, useTranslation } from 'react-i18next';

import EmailCodeFallback from '../../common/EmailCodeFallback';

export type LoginLinkEmailProps = {
	onResendEmailRequest: () => void;
	onChangeEmailRequest: () => void;
};

const LoginLinkEmailPage = ({ onResendEmailRequest, onChangeEmailRequest }: LoginLinkEmailProps) => {
	const { t } = useTranslation();

	return (
		<BackgroundLayer>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='center'
				textAlign='center'
				width='100%'
				maxWidth={800}
				paddingBlock={32}
				paddingInline={16}
			>
				<Margins blockEnd={32}>
					<LayoutLogo />

					<Box fontScale='hero' width='100%'>
						{t('page.magicLinkEmail.title')}
					</Box>

					<Box fontScale='p1' maxWidth={570}>
						<Trans i18nKey='page.magicLinkEmail.subtitle' />
					</Box>

					<EmailCodeFallback onResendEmailRequest={onResendEmailRequest} onChangeEmailRequest={onChangeEmailRequest} />
				</Margins>
			</Box>
		</BackgroundLayer>
	);
};

export default LoginLinkEmailPage;
