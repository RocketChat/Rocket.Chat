import { Box } from '@rocket.chat/fuselage';
import { BackgroundLayer, LayoutLogo } from '@rocket.chat/layout';
import { useTranslation } from 'react-i18next';

export type SomethingWentWrongPageProps = {
	requestId?: string | undefined;
};

const SomethingWentWrongPage = ({ requestId = undefined }: SomethingWentWrongPageProps) => {
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
				maxWidth={624}
				paddingBlock='x32'
				marginBlockEnd='x32'
				paddingInline='x16'
			>
				<LayoutLogo />

				<Box fontScale='hero'>{t('page.somethingWentWrongPage.title')}</Box>

				<Box fontScale='p1'>{t('page.somethingWentWrongPage.subtitle')}</Box>
				{requestId && <Box>{t('page.somethingWentWrongPage.requestId', { requestId })}</Box>}
			</Box>
		</BackgroundLayer>
	);
};

export default SomethingWentWrongPage;
