import { ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import {
	ToggleButton,
	PeerInfo,
	Widget,
	WidgetFooter,
	WidgetHandle,
	WidgetHeader,
	WidgetContent,
	WidgetInfo,
	Timer,
	DevicePicker,
	ActionButton,
	useKeypad,
	useInfoSlots,
} from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';

const OngoingCall = () => {
	const { t } = useTranslation();

	const { sessionState, onMute, onHold, onForward, onEndCall, onTone, onClickDirectMessage } = useMediaCallView();
	const { muted, held, remoteMuted, remoteHeld, peerInfo, connectionState, supportedFeatures } = sessionState;

	const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	const slots = useInfoSlots(muted, held, connectionState);
	const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const transferDisabled = !supportedFeatures.includes('transfer');
	const holdDisabled = !supportedFeatures.includes('hold');

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={connecting ? t('meteor_status_connecting') : <Timer />}>
				{onClickDirectMessage && (
					<ActionButton tiny secondary={false} label={t('Direct_Message')} icon='balloon' onClick={onClickDirectMessage} />
				)}
				<DevicePicker />
			</WidgetHeader>
			<WidgetContent>
				<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />
			</WidgetContent>
			<WidgetInfo slots={slots} />
			<WidgetFooter>
				{keypad}
				<ButtonGroup large>
					<ActionButton disabled={connecting || reconnecting} icon='dialpad' label='Dialpad' {...keypadButtonProps} />
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[holdDisabled ? t('Call_feature_unsupported') : t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
						disabled={connecting || reconnecting || holdDisabled}
					/>
					<ActionButton
						disabled={connecting || reconnecting || transferDisabled}
						label={t('Forward')}
						icon='arrow-forward'
						title={transferDisabled ? t('Call_feature_unsupported') : t('Forward')}
						onClick={onForward}
					/>
					<ActionButton
						label={t('Voice_call__user__hangup', { user: 'userId' in peerInfo ? peerInfo.displayName : peerInfo.number })}
						icon='phone-off'
						danger
						onClick={onEndCall}
					/>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default OngoingCall;
