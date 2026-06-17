import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import VideoCallButton from './VideoCallButton';

type VideoCallWidgetActionProps = {
	escalated?: boolean;
	loading?: boolean;
	onClick: () => void | Promise<void>;
};

const VideoCallWidgetAction = ({ escalated, loading, onClick }: VideoCallWidgetActionProps) => {
	const { t } = useTranslation();
	return (
		<Box mbs={8}>
			{escalated && (
				<Box role='status' aria-atomic='true' fontScale='p2' mbe={8}>
					{t('Switched_to_video_call')}
				</Box>
			)}
			<VideoCallButton w='full' escalated={escalated} loading={loading} onClick={onClick} />
		</Box>
	);
};

export default VideoCallWidgetAction;
