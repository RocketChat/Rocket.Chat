import { type TFunction } from 'i18next';
import { useState } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { getAvatarUrl, getConnectionBaseUrl } from '../../helpers/baseUrl';
import { createClassName } from '../../helpers/createClassName';
import { isMobileDevice } from '../../helpers/isMobileDevice';
import PhoneAccept from '../../icons/phone.svg';
import PhoneDecline from '../../icons/phoneOff.svg';
import constants from '../../lib/constants';
import store, { type Dispatch } from '../../store';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { CallStatus } from './CallStatus';
import styles from './styles.scss';

type CallNotificationProps = {
	callProvider: string;
	callerUsername: string;
	url: string;
	dispatch: Dispatch;
	time: number;
	rid: string;
	callId: string;
	t: TFunction;
};

const CallNotification = ({ callProvider, callerUsername, url, dispatch, time, rid, callId, t }: CallNotificationProps) => {
	const [show, setShow] = useState(true);

	const callInNewTab = async () => {
		const { token } = store.state;
		const url = `${getConnectionBaseUrl()}/meet/${rid}?token=${token}`;
		await dispatch({
			ongoingCall: {
				callStatus: CallStatus.IN_PROGRESS_DIFFERENT_TAB,
				time: { time },
			},
			incomingCallAlert: {
				show: false,
				callProvider,
			},
		});
		window.open(url, rid);
	};

	const acceptClick = async () => {
		setShow(!show);
		switch (callProvider) {
			case 'video-conference': {
				window.open(url, rid);
				dispatch({
					incomingCallAlert: { show: false, url, callProvider },
					ongoingCall: {
						callStatus: CallStatus.IN_PROGRESS_DIFFERENT_TAB,
						time: { time },
					},
				});
				break;
			}
			case constants.webRTCCallStartedMessageType: {
				await Livechat.updateCallStatus(CallStatus.IN_PROGRESS, rid, callId);
				if (isMobileDevice()) {
					callInNewTab();
					break;
				}
				dispatch({ ongoingCall: { callStatus: CallStatus.IN_PROGRESS_SAME_TAB, time: { time } } });
				break;
			}
		}
	};

	const declineClick = async () => {
		await Livechat.updateCallStatus(CallStatus.DECLINED, rid, callId);
		await Livechat.notifyCallDeclined(rid);
		dispatch({
			incomingCallAlert: null,
			ongoingCall: {
				callStatus: CallStatus.DECLINED,
				time: { time },
			},
		});
	};

	return (
		<div className={createClassName(styles, 'call-notification')}>
			{show && (
				<div className={createClassName(styles, 'call-notification__content')}>
					<div className={createClassName(styles, 'call-notification__content-avatar')}>
						<Avatar src={getAvatarUrl(callerUsername) ?? undefined} large />
					</div>
					<div className={createClassName(styles, 'call-notification__content-message')}>{t('incoming_video_call')}</div>
					<div className={createClassName(styles, 'call-notification__content-actions')}>
						<Button onClick={declineClick} className={createClassName(styles, 'call-notification__content-actions-decline')}>
							<PhoneDecline width={20} height={20} />
							<span style='margin-left:5px'> {t('decline')} </span>
						</Button>
						<Button onClick={acceptClick} className={createClassName(styles, 'call-notification__content-actions-accept')}>
							<PhoneAccept width={20} height={20} />
							<span style='margin-left:5px'> {t('accept')} </span>
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default withTranslation()(CallNotification);
