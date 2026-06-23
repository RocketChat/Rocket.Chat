import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ToggleButton, Timer, DevicePicker, ActionButton, useShouldWrapCards, ActionStrip } from '../components';
import MediaCallCardList from './MediaCallCardList';
import { useMediaCallView } from '../context/MediaCallViewContext';

type MediaCallPopoutViewProps = {
	user: {
		displayName: string;
		avatarUrl: string;
	};
	onClickClosePopout: () => void;
	onClickFullscreen: () => void;
	fullscreen: boolean;
};

const MediaCallPopoutView = ({ user, onClickClosePopout, onClickFullscreen, fullscreen }: MediaCallPopoutViewProps) => {
	const { t } = useTranslation();

	const {
		sessionState,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onToggleScreenSharing,
		streams: { localScreen },
	} = useMediaCallView();

	const { muted, held, peerInfo, connectionState, startedAt } = sessionState;

	const { ref, borderBoxSize } = useResizeObserver<HTMLDivElement>();

	const shouldWrapCards = useShouldWrapCards(false, borderBoxSize?.blockSize || 0);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	if (!peerInfo || 'number' in peerInfo) {
		return null;
	}

	return (
		<Box
			is='main'
			aria-label={t('Voice_call')}
			id='outer-element'
			w='full'
			h='full'
			bg='surface-tint'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			ref={ref}
		>
			<MediaCallCardList user={user} shouldWrapCards={shouldWrapCards} />
			<ActionStrip
				leftSlot={
					<Box color='default' alignContent='center' pis={16}>
						<Timer startAt={startedAt} />
					</Box>
				}
				rightSlot={
					<ButtonGroup>
						<ActionButton label={t('Return_to_main_window')} icon='arrow-from-cross-box' onClick={onClickClosePopout} />
						<ToggleButton
							label={t('Fullscreen')}
							titles={[t('Fullscreen'), t('Exit_fullscreen')]}
							icons={['arrow-expand', 'arrow-collapse']}
							pressed={fullscreen}
							onToggle={onClickFullscreen}
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

export default memo(MediaCallPopoutView);
