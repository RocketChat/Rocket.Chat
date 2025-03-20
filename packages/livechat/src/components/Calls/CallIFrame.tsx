import { useEffect } from 'preact/hooks';

import { getConnectionBaseUrl } from '../../helpers/baseUrl';
import { createClassName } from '../../helpers/createClassName';
import store from '../../store';
import { CallStatus } from './CallStatus';
import styles from './styles.scss';

export const CallIframe = () => {
	const { token, room, incomingCallAlert, ongoingCall } = store.state;
	const url = room && `${getConnectionBaseUrl()}/meet/${room._id}?token=${token}&layout=embedded`;

	useEffect(() => {
		window.handleIframeClose = () => store.setState({ incomingCallAlert: { ...incomingCallAlert, show: false } });

		window.expandCall = () => {
			if (!room) {
				return;
			}
			window.open(`${getConnectionBaseUrl()}/meet/${room._id}?token=${token}`, room._id);
			return store.setState({
				incomingCallAlert: { ...incomingCallAlert, show: false },
				ongoingCall: {
					...ongoingCall,
					callStatus: CallStatus.IN_PROGRESS_DIFFERENT_TAB,
				},
			});
		};
	});

	return (
		<div className={createClassName(styles, 'call-iframe')}>
			<iframe className={createClassName(styles, 'call-iframe__content')} allow='camera;microphone' src={url} />
		</div>
	);
};
