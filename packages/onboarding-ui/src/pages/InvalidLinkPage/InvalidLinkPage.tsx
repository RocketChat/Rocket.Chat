import { Box, Margins, Button } from '@rocket.chat/fuselage';
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
				paddingBlock={32}
				paddingInline={16}
			>
				<Margins blockEnd={32}>
					<LayoutLogo />

					<Box fontScale='hero'>{t('page.invalidLink.title')}</Box>

					<Box fontScale='p1'>{t('page.invalidLink.content')}</Box>

					<Button onClick={onRequestNewLink} primary>
						{t('page.invalidLink.button.text')}
					</Button>
				</Margins>
			</Box>
		</BackgroundLayer>
	);
};

export default InvalidLinkPage;
