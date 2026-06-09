import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type VideoCallButtonProps = {
	escalated?: boolean;
	loading?: boolean;
	onClick: () => void;
};

const VideoCallButton = ({ escalated, loading, onClick }: VideoCallButtonProps) => {
	const { t } = useTranslation();

	return (
		<>
			{escalated ? (
				<Button primary w='full' icon='video' loading={loading} aria-busy={loading} onClick={() => onClick()}>
					{t('Join_video_call')}
				</Button>
			) : (
				<Button w='full' icon='video' loading={loading} aria-busy={loading} onClick={() => onClick()}>
					{t('Start_a_video_call')}
				</Button>
			)}
		</>
	);
};

export default VideoCallButton;
