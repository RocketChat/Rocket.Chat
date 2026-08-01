import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { ToggleButton, ActionButton, ActionStrip, ActionToggleChat } from '../../components';

export type CallBarProps = {
	/** e.g. "Call in General" or "Sharing your screen" */
	statusText: string;
	muted: boolean;
	camOn: boolean;
	sharing: boolean;
	handRaised: boolean;
	unreadCount?: number;
	onToggleMic: () => void;
	onToggleCam: () => void;
	onToggleShare: () => void;
	onToggleHand?: () => void;
	onHangup: () => void;
	/** focus the call window (status text and thread button) */
	onReturnToCall: () => void;
};

/**
 * Persistent in-app call bar ("_[Local] Call bar" in the Figma spec): the
 * single representation of an active call inside the main app while the call
 * itself runs in the pop-out window. No video feed by design — status text,
 * media controls mirrored from the call, and a way back to the window.
 */
const CallBar = ({
	statusText,
	muted,
	camOn,
	sharing,
	handRaised,
	unreadCount = 0,
	onToggleMic,
	onToggleCam,
	onToggleShare,
	onToggleHand,
	onHangup,
	onReturnToCall,
}: CallBarProps) => {
	const { t } = useTranslation();

	return (
		<ActionStrip
			leftSlot={
				<Box
					is='button'
					type='button'
					fontScale='c1'
					color='hint'
					withTruncatedText
					onClick={onReturnToCall}
					title={t('Return_to_call')}
					style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
				>
					{statusText}
				</Box>
			}
			rightSlot={<ActionToggleChat pressed={false} onClick={onReturnToCall} unreadCount={unreadCount} />}
		>
			<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onToggleMic} />
			<ToggleButton
				label={t('Camera')}
				icons={['video', 'video-off']}
				titles={[t('Stop_camera'), t('Start_camera')]}
				pressed={!camOn}
				onToggle={onToggleCam}
			/>
			<ToggleButton
				label={t('Share_screen')}
				icons={['desktop-arrow-up', 'desktop-cross']}
				titles={[t('Share_screen'), t('Stop_sharing_screen')]}
				pressed={sharing}
				onToggle={onToggleShare}
			/>
			{onToggleHand && (
				<ToggleButton
					label={t('Raise_hand')}
					icons={['hand-pointer', 'hand-pointer']}
					titles={[t('Raise_hand'), t('Lower_hand')]}
					pressed={handRaised}
					onToggle={onToggleHand}
				/>
			)}
			<ActionButton danger label={t('End_call')} icon='phone-off' onClick={onHangup} />
		</ActionStrip>
	);
};

export default CallBar;
