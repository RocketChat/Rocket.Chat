import { Livechat } from '../../api';
import store from '../../store';
import { createClassName } from '../helpers';
import { CallStatus } from './CallStatus';
import styles from './styles.scss';


export const CallIframe = () => {
	const { token, room, incomingCallAlert, ongoingCall } = store.state;
	const url = `${ Livechat.client.host }/meet/${ room._id }?token=${ token }&layout=embedded`;
	window.handleIframeClose = () => store.setState({ incomingCallAlert: { ...incomingCallAlert, show: false } });
	window.expandCall = () => {
		window.open(
			`${ Livechat.client.host }/meet/${ room._id }?token=${ token }`,
			room._id,
		);
		return store.setState({
			incomingCallAlert: { ...incomingCallAlert, show: false },
			ongoingCall: {
				...ongoingCall,
				callStatus: CallStatus.IN_PROGRESS_DIFFERENT_TAB,
			},
		});
	};
	return (
		<div className={createClassName(styles, 'call-iframe')}>
			<iframe className={createClassName(styles, 'call-iframe__content')} allow='camera;microphone' src={url} />
		</div>
	);
};
