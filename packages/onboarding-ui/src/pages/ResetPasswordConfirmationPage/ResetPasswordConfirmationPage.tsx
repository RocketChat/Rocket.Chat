import { Box } from '@rocket.chat/fuselage';
import { BackgroundLayer, LayoutLogo } from '@rocket.chat/layout';
import { useTranslation } from 'react-i18next';

const ResetPasswordConfirmationPage = () => {
	const { t } = useTranslation();
	return (
		<BackgroundLayer>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='center'
				textAlign='center'
				gap='x32'
				width='100%'
				maxWidth={576}
				paddingBlock='x32'
				marginBlockEnd='x32'
				paddingInline='x16'
			>
				<LayoutLogo />

				<Box fontScale='hero'>{t('page.resetPasswordPage.emailSent.title')}</Box>

				<Box fontScale='p1'>{t('page.resetPasswordPage.emailSent.subtitle')}</Box>
			</Box>
		</BackgroundLayer>
	);
};

export default ResetPasswordConfirmationPage;
