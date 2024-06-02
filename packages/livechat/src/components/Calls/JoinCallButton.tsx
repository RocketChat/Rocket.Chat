import { type TFunction } from 'i18next';
import { withTranslation } from 'react-i18next';

import { getConnectionBaseUrl } from '../../helpers/baseUrl';
import { createClassName } from '../../helpers/createClassName';
import VideoIcon from '../../icons/video.svg';
import constants from '../../lib/constants';
import store from '../../store';
import { Button } from '../Button';
import { type CallStatus, isCallOngoing } from './CallStatus';
import styles from './styles.scss';

type JoinCallButtonProps = {
	t: TFunction;
	callProvider: string;
	url: string;
	callStatus: CallStatus;
};

export const JoinCallButton = ({ t, ...props }: JoinCallButtonProps) => {
	const { token, room } = store.state;

	const clickJoinCall = () => {
		if (!room) {
			return;
		}
		switch (props.callProvider) {
			case 'video-conference': {
				window.open(props.url, room._id);
				break;
			}
			case constants.webRTCCallStartedMessageType: {
				window.open(`${getConnectionBaseUrl()}/meet/${room._id}?token=${token}`, room._id);
				break;
			}
		}
	};
	return (
		<div className={createClassName(styles, 'joinCall')}>
			{isCallOngoing(props.callStatus) && (
				<div>
					<div className={createClassName(styles, 'joinCall__content')}>
						<div className={createClassName(styles, 'joinCall__content-videoIcon')}>
							<VideoIcon width={20} height={20} />
						</div>
						{t('join_my_room_to_start_the_video_call')}
					</div>
					<Button onClick={clickJoinCall} className={createClassName(styles, 'joinCall__content-action')}>
						<VideoIcon width={20} height={20} />
						{t('join_call')}
					</Button>
				</div>
			)}
		</div>
	);
};

export default withTranslation()(JoinCallButton);
