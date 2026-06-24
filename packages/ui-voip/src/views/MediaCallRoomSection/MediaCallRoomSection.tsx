import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import PeerCardsView from './PeerCardsView';
import {
	ToggleButton,
	Timer,
	DevicePicker,
	ActionButton,
	useShouldWrapCards,
	CARD_LIST_SECTION_MAX_HEIGHT,
	ActionStrip,
	ActionToggleChat,
} from '../../components';
import { useMediaCallInstance } from '../../context/MediaCallInstanceContext';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRegisterView from '../../context/useRegisterView';

type MediaCallRoomSectionProps = {
	showChat: boolean;
	onToggleChat: () => void;
	user: {
		displayName: string;
		avatarUrl: string;
	};
	containerHeight: number;
};

const getSplitStyles = (showChat?: boolean) => {
	if (showChat) {
		return {
			maxHeight: `${CARD_LIST_SECTION_MAX_HEIGHT}vh`,
		};
	}
	return {
		height: '100%',
		// This is a workaround to match the border height with the sidebar footer
		// The sidebar footer uses a divider instead of a border, so it's 1px taller than it should be.
		paddingBlockEnd: '1px',
	};
};

const MediaCallRoomSection = ({ showChat, onToggleChat, user, containerHeight }: MediaCallRoomSectionProps) => {
	const { t } = useTranslation();

	const {
		sessionState,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onToggleScreenSharing,
		onOpenPopout,
		onClosePopout,
		streams: { localScreen },
	} = useMediaCallView();
	const { currentViews } = useMediaCallInstance();

	const isPopout = currentViews.includes('popout');

	const { muted, held, peerInfo, connectionState, startedAt } = sessionState;

	const shouldWrapCards = useShouldWrapCards(showChat, containerHeight);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	useRegisterView('room');

	if (!peerInfo || 'number' in peerInfo) {
		return null;
	}

	return (
		<Box
			id='outer-element'
			w='full'
			bg='surface-tint'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			is='section'
			aria-label={t('Voice_call')}
			{...getSplitStyles(showChat)}
		>
			<PeerCardsView user={user} shouldWrapCards={shouldWrapCards} />
			<ActionStrip
				leftSlot={
					<Box color='default' alignContent='center' pis={16}>
						<Timer startAt={startedAt} />
					</Box>
				}
				rightSlot={
					<ButtonGroup>
						<ActionToggleChat pressed={showChat} onClick={onToggleChat} />
						<ToggleButton
							label={t('Open_in_new_window')}
							titles={[t('Open_in_new_window'), t('Return_to_main_window')]}
							icons={['arrow-to-square-box', 'arrow-from-cross-box']}
							pressed={isPopout}
							onToggle={isPopout ? onClosePopout : onOpenPopout}
							danger={false}
						/>
						<DevicePicker secondary />
					</ButtonGroup>
				}
			>
				<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
				<ToggleButton
					label={t('Hold')}
					icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
					titles={[t('Hold'), t('Resume')]}
					pressed={held}
					onToggle={onHold}
				/>
				<ToggleButton
					label={t('Share_screen')}
					icons={['desktop-arrow-up', 'desktop-cross']}
					titles={[t('Share_screen'), t('Stop_sharing_screen')]}
					pressed={localScreen?.active ?? false}
					onToggle={onToggleScreenSharing}
				/>
				<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
				<ActionButton label={t('Voice_call__user__hangup', { user: peerInfo.displayName })} icon='phone-off' danger onClick={onEndCall} />
			</ActionStrip>
		</Box>
	);
};

export default memo(MediaCallRoomSection);
