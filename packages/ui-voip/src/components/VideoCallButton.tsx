import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

type VideoCallButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
	escalated?: boolean;
	loading?: boolean;
	onClick: () => void;
};

const VideoCallButton = ({ escalated, loading, onClick, ...props }: VideoCallButtonProps) => {
	const { t } = useTranslation();

	return (
		<>
			{escalated ? (
				<Button primary icon='video' loading={loading} aria-busy={loading} onClick={() => onClick()} {...props}>
					{t('Join_video_call')}
				</Button>
			) : (
				<Button icon='video' loading={loading} aria-busy={loading} onClick={() => onClick()} {...props}>
					{t('Start_a_video_call')}
				</Button>
			)}
		</>
	);
};

export default VideoCallButton;
