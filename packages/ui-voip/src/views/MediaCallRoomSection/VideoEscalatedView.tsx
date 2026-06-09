import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import VideoCallButton from '../../components/VideoCallButton';
import { useMediaCallView } from '../../context';

const VideoEscalatedView = () => {
	const { t } = useTranslation();
	const { isRequestingVideoCall, onRequestVideoCall } = useMediaCallView();

	return (
		<Box
			display='flex'
			flexDirection='column'
			alignItems='center'
			justifyContent='center'
			flexGrow={1}
			flexShrink={1}
			maxHeight='full'
			minHeight={180}
			p={16}
		>
			<Box is='h3' fontScale='h3' mbe={30} color='default'>
				{t('Switched_to_video_call')}
			</Box>
			<VideoCallButton escalated loading={isRequestingVideoCall} onClick={onRequestVideoCall} />
		</Box>
	);
};

export default VideoEscalatedView;
