import { Box, IconButton } from '@rocket.chat/fuselage';
import { usePlayMediaStream } from '@rocket.chat/ui-voip';
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
	const [videoRef] = usePlayMediaStream(stream);
	return (
		<Box className={screenThumbStyles}>
			<video ref={videoRef} preload='metadata' muted style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
				<track kind='captions' />
			</video>
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
