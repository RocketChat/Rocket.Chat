import { Box, IconButton } from '@rocket.chat/fuselage';
import { StreamVideo } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { ownBadgeStyles, screenThumbStyles, spotlightOverlayStyles } from './stageStyles';

export type ScreenShareThumbProps = {
	stream: MediaStream;
	label: string;
	onSpotlight: () => void;
};

/** A screen shared while another one has the stage, with a button, on hover, to give it the stage instead. */
const ScreenShareThumb = ({ stream, label, onSpotlight }: ScreenShareThumbProps) => {
	const { t } = useTranslation();
	return (
		<Box className={screenThumbStyles}>
			<StreamVideo stream={stream} fit='contain' />
			<Box className={ownBadgeStyles} fontScale='c1'>
				{label}
			</Box>
			<Box className={['rcx-screen-thumb-overlay', spotlightOverlayStyles]}>
				<IconButton icon='arrow-expand' small primary onClick={onSpotlight} title={t('Spotlight_screen')} />
			</Box>
		</Box>
	);
};

export default ScreenShareThumb;
