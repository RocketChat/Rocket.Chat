import { Box } from '@rocket.chat/fuselage';

import CameraMenu from './CameraMenu';
import MicrophoneMenu from './MicrophoneMenu';
import { usePreviewMedia } from './PreviewMediaContext';
import SpeakerMenu from './SpeakerMenu';

/** The devices to arrive on, one menu per kind the provider can be told about. */
const PreflightDevices = () => {
	const { capabilities } = usePreviewMedia();

	return (
		<Box
			display='grid'
			width='100%'
			alignItems='center'
			marginBlockStart={12}
			paddingInline={20}
			// `auto-fit` is what makes them wrap: three columns while there is room, one per row on a phone, where
			// forcing three cut every device name down to nothing.
			style={{ gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
		>
			{capabilities.mic && <MicrophoneMenu />}
			<SpeakerMenu />
			{capabilities.cam && <CameraMenu />}
		</Box>
	);
};

export default PreflightDevices;
