import { ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { VoiceCallSession } from '../../../../../contexts/VoiceCallContext';

type VoiceCallActionsProps = {
	session?: VoiceCallSession;
	isDTMFActive?: boolean;
	isTransferActive?: boolean;
	onDTMF?: () => void;
	onEndCall?: () => void;
	onTransfer?: () => void;
};

type Actions = 'accept' | 'decline' | 'mute' | 'hold' | 'transfer' | 'DTMF' | 'end';

const ACTIONS_BY_TYPE: Record<VoiceCallSession['type'] | 'IDLE', Actions[]> = {
	INCOMING: ['accept', 'decline'],
	ONGOING: ['accept', 'end', 'mute', 'hold', 'DTMF', 'transfer'],
	OUTGOING: ['decline'],
	ERROR: ['decline'],
	IDLE: [],
};

const VoiceCallActions = ({ session, isDTMFActive, onDTMF, onTransfer, isTransferActive }: VoiceCallActionsProps) => {
	const { t } = useTranslation();
	const { type, muted = false, held = false } = session || {};
	const permissions = ACTIONS_BY_TYPE[type || 'IDLE'];
	const isIncoming = session?.type === 'INCOMING';
	const isOngoing = session?.type === 'ONGOING';

	return (
		<ButtonGroup large>
			{isIncoming && (
				<IconButton
					mini
					danger
					secondary
					width={32}
					height={32}
					icon='phone-off'
					data-tooltip={t('Decline')}
					aria-label={t('Decline')}
					onClick={() => session.end()}
				/>
			)}

			<IconButton
				mini
				width={32}
				height={32}
				pressed={muted}
				icon='mic-off'
				aria-label={muted ? t('Turn_on_microphone') : t('Turn_off_microphone')}
				data-tooltip={muted ? t('Turn_on_microphone') : t('Turn_off_microphone')}
				disabled={!permissions.includes('mute')}
				onClick={() => (isIncoming || isOngoing) && session.mute(!muted)}
			/>

			{!isIncoming && (
				<IconButton
					mini
					width={32}
					height={32}
					pressed={held}
					icon='pause-shape-filled' // TODO: change to pause-shape-unfilled
					aria-label={held ? t('Resume') : t('Hold')}
					data-tooltip={held ? t('Resume') : t('Hold')}
					disabled={!permissions.includes('hold')}
					onClick={() => isOngoing && session.hold(!held)}
				/>
			)}

			<IconButton
				mini
				width={32}
				height={32}
				icon='dialpad'
				pressed={isDTMFActive}
				disabled={!onDTMF || !permissions.includes('DTMF')}
				aria-label={t('Open_Dialpad')}
				onClick={onDTMF}
			/>

			<IconButton
				mini
				icon='arrow-forward'
				width={32}
				height={32}
				pressed={isTransferActive}
				disabled={!onTransfer || !permissions.includes('transfer')}
				onClick={onTransfer}
			/>

			{!isIncoming && (
				<IconButton
					mini
					secondary
					danger
					width={32}
					height={32}
					icon='phone-off'
					disabled={held}
					aria-label={t('End_call')}
					data-tooltip={t('End_Call')}
					onClick={() => session?.end()}
				/>
			)}

			{isIncoming && (
				<IconButton
					mini
					success
					secondary
					width={32}
					height={32}
					icon='phone'
					aria-label={t('Accept')}
					data-tooltip={t('Accept')}
					onClick={() => session.accept()}
				/>
			)}
		</ButtonGroup>
	);
};

export default VoiceCallActions;
