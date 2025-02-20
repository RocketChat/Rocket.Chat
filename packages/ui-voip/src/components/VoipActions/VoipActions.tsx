import { ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ActionButton from '../VoipActionButton';

type VoipGenericActionsProps = {
	isDTMFActive?: boolean;
	isTransferActive?: boolean;
	isMuted?: boolean;
	isHeld?: boolean;
	onDTMF?: () => void;
	onTransfer?: () => void;
	onMute?: (muted: boolean) => void;
	onHold?: (held: boolean) => void;
};

type VoipIncomingActionsProps = VoipGenericActionsProps & {
	onEndCall?: never;
	onDecline: () => void;
	onAccept: () => void;
};

type VoipOngoingActionsProps = VoipGenericActionsProps & {
	onDecline?: never;
	onAccept?: never;
	onEndCall: () => void;
};

type VoipActionsProps = VoipIncomingActionsProps | VoipOngoingActionsProps;

const isIncoming = (props: VoipActionsProps): props is VoipIncomingActionsProps =>
	'onDecline' in props && 'onAccept' in props && !('onEndCall' in props);

const isOngoing = (props: VoipActionsProps): props is VoipOngoingActionsProps =>
	'onEndCall' in props && !('onAccept' in props && 'onDecline' in props);

const VoipActions = ({ isMuted, isHeld, isDTMFActive, isTransferActive, ...events }: VoipActionsProps) => {
	const { t } = useTranslation();

	return (
		<ButtonGroup large>
			{isIncoming(events) && <ActionButton danger label={t('Decline')} icon='phone-off' onClick={events.onDecline} />}

			<ActionButton
				label={isMuted ? t('Turn_on_microphone') : t('Turn_off_microphone')}
				icon='mic-off'
				pressed={isMuted}
				disabled={!events.onMute}
				onClick={() => events.onMute?.(!isMuted)}
			/>

			{!isIncoming(events) && (
				<ActionButton
					label={isHeld ? t('Resume') : t('Hold')}
					icon='pause-shape-unfilled'
					pressed={isHeld}
					disabled={!events.onHold}
					onClick={() => events.onHold?.(!isHeld)}
				/>
			)}

			<ActionButton
				label={isDTMFActive ? t('Close_Dialpad') : t('Open_Dialpad')}
				icon='dialpad'
				pressed={isDTMFActive}
				disabled={!events.onDTMF}
				onClick={events.onDTMF}
			/>

			<ActionButton
				label={t('Transfer_call')}
				icon='arrow-forward'
				pressed={isTransferActive}
				disabled={!events.onTransfer}
				onClick={events.onTransfer}
			/>

			{isOngoing(events) && <ActionButton danger label={t('End_call')} icon='phone-off' disabled={isHeld} onClick={events.onEndCall} />}

			{isIncoming(events) && <ActionButton success label={t('Accept')} icon='phone' onClick={events.onAccept} />}
		</ButtonGroup>
	);
};

export default VoipActions;
