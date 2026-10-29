import { Box, Button } from '@rocket.chat/fuselage';
import { BackgroundLayer, LayoutLogo } from '@rocket.chat/layout';
import { useTranslation } from 'react-i18next';

export type InvalidLinkPageProps = {
	onRequestNewLink: () => void;
};

const InvalidLinkPage = ({ onRequestNewLink }: InvalidLinkPageProps) => {
	const { t } = useTranslation();

	return (
		<BackgroundLayer>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='center'
				textAlign='center'
				width='100%'
				maxWidth={576}
				paddingBlockStart={32}
				paddingBlockEnd={64}
				paddingInline={16}
				gap={32}
			>
				<LayoutLogo />

				<Box fontScale='hero'>{t('page.invalidLink.title')}</Box>

				<Box fontScale='p1'>{t('page.invalidLink.content')}</Box>

				<Button onClick={onRequestNewLink} variant='primary'>
					{t('page.invalidLink.button.text')}
				</Button>
			</Box>
		</BackgroundLayer>
	);
};

export default InvalidLinkPage;
