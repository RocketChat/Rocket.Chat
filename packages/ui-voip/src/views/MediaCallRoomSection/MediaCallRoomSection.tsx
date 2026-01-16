import { Box, ButtonGroup } from '@rocket.chat/fuselage';
// import type { ReactNode } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

// import CardGrid, { CardLayout, CardGridSection } from './CardGrid';
import CardGrid from './CardGrid';
// import CardItem from './CardItem';
import CardItem from './CardItem';
import PeerCard from './PeerCard';
import StreamCard from './StreamCard';
import {
	ToggleButton,
	// PeerInfo,
	// Widget,
	// WidgetFooter,
	// WidgetHandle,
	// WidgetHeader,
	// WidgetContent,
	// WidgetInfo,
	Timer,
	DevicePicker,
	ActionButton,
	// useKeypad,
	// useInfoSlots,
} from '../../components';
import { useMediaCallContext } from '../../context';
import useMediaStream from '../../context/useMediaStream';
import useRoomView from '../../context/useRoomView';

const getSplitStyles = (showChat: boolean) => {
	if (showChat) {
		return {
			maxHeight: '50vh',
			borderBlockEnd: '1px solid',
			borderBlockEndColor: 'stroke-light',
		};
	}
	return {
		height: '100%',
	};
};

type RoomCallSectionProps = {
	showChat: boolean;
	onToggleChat: () => void;
	user: {
		displayName: string;
		avatarUrl: string;
	};
};

const RoomCallSection = ({ showChat, onToggleChat, user }: RoomCallSectionProps) => {
	const { t } = useTranslation();
	const [sharingScreen, setSharingScreen] = useState<boolean>(false);
	const {
		muted,
		held,
		remoteMuted,
		remoteHeld,
		onMute,
		onHold,
		onForward,
		onEndCall,
		// onTone,
		peerInfo,
		connectionState,
		// expanded,
		// getRemoteStream,
		getRemoteVideoStream,
		toggleScreenSharing,
		getLocalVideoStream,
	} = useMediaCallContext();

	// const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	// const slots = useInfoSlots(muted, held, connectionState);
	// const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const remoteVideoStream = getRemoteVideoStream();
	const localVideoStreamWrapper = getLocalVideoStream();
	const localVideoStream = localVideoStreamWrapper?.stream ?? null;

	console.log('localVideoStream', localVideoStream);
	console.log('remoteVideoStream', remoteVideoStream);

	const [remoteStreamRefCallback] = useMediaStream(remoteVideoStream);
	const [localStreamRefCallback] = useMediaStream(localVideoStream);

	useRoomView();

	const onClickShareScreen = () => {
		toggleScreenSharing();
		setSharingScreen((prev) => !prev);
	};

	// const streaming = localVideoStream?.active || remoteVideoStream?.active;

	// TODO: Figure out how to ensure this always exist before rendering the component
	// TODO flter out external peer info
	if (!peerInfo || 'number' in peerInfo) {
		return null;
		// throw new Error('Peer info is required');
	}

	// const cardData: Array<{
	// 	span?: [number, number];
	// 	columns?: [number, number];
	// 	rows?: [number, number];
	// 	content: ReactNode;
	// }> = [
	// 	{
	// 		span: [2, 2],
	// 		content: (
	// 			<PeerCard
	// 				displayName={user.displayName}
	// 				avatarUrl={user.avatarUrl}
	// 				muted={muted}
	// 				held={held}
	// 				sharing={localVideoStream?.active ?? false}
	// 			/>
	// 		),
	// 	},
	// 	{
	// 		span: [2, 2],
	// 		content: (
	// 			<PeerCard
	// 				displayName={peerInfo.displayName}
	// 				avatarUrl={peerInfo.avatarUrl}
	// 				muted={remoteMuted}
	// 				held={remoteHeld}
	// 				sharing={remoteVideoStream?.active ?? false}
	// 			/>
	// 		),
	// 	},
	// 	{
	// 		columns: [2, -1],
	// 		span: [1, -1],
	// 		content: (
	// 			<StreamCard title='Remote Video' slots={{ topLeft: <Timer /> }}>
	// 				<video preload='metadata' style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }} ref={remoteStreamRefCallback}>
	// 					<track kind='captions' />
	// 				</video>
	// 			</StreamCard>
	// 		),
	// 	},
	// 	{
	// 		columns: [2, -1],
	// 		rows: [1, -1],
	// 		content: (
	// 			<StreamCard title='Local Video'>
	// 				<video preload='metadata' style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }} ref={localStreamRefCallback}>
	// 					<track kind='captions' />
	// 				</video>
	// 			</StreamCard>
	// 		),
	// 	},
	// ];

	// TODO: Video element arrangement and "pinning"
	return (
		<Box
			id='outer-element'
			w='full'
			bg='hover'
			// flexShrink={1}
			// flexGrow={1}
			borderBlockEnd='1px solid'
			borderBlockEndColor='stroke-light'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			{...getSplitStyles(showChat)}
		>
			{/* TODO wrapper component for the cards */}
			{/* <Box display='flex' w='full' flexWrap='wrap' mbe={8} overflow='hidden'> */}
			<Box flexGrow={1} flexShrink={1} overflow='hidden' maxHeight='100%'>
				{/* <Box display='flex' flexDirection='column' padding={8} flexWrap='wrap'>
					<PeerCard
						displayName={user.displayName}
						avatarUrl={user.avatarUrl}
						muted={muted}
						held={held}
						sharing={localVideoStream?.active ?? false}
					/>
					<PeerCard
						displayName={peerInfo.displayName}
						avatarUrl={peerInfo.avatarUrl}
						muted={remoteMuted}
						held={remoteHeld}
						sharing={remoteVideoStream?.active ?? false}
					/>

					{remoteVideoStream && (
						<StreamCard title='Remote Video' slots={{ topLeft: <Timer /> }}>
							<video preload='metadata' style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }} ref={remoteStreamRefCallback}>
								<track kind='captions' />
							</video>
						</StreamCard>
					)}
					{localVideoStream?.active && (
						<StreamCard title='Local Video'>
							<video preload='metadata' style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }} ref={localStreamRefCallback}>
								<track kind='captions' />
							</video>
						</StreamCard>
					)}
				</Box> */}
				<CardGrid direction='column'>
					<CardItem>
						<PeerCard
							displayName={user.displayName}
							avatarUrl={user.avatarUrl}
							muted={muted}
							held={held}
							sharing={localVideoStream?.active ?? false}
						/>
					</CardItem>
					<CardItem>
						<PeerCard
							displayName={peerInfo.displayName}
							avatarUrl={peerInfo.avatarUrl}
							muted={remoteMuted}
							held={remoteHeld}
							sharing={remoteVideoStream?.active ?? false}
						/>
					</CardItem>
					{remoteVideoStream && (
						<CardItem columnSpan={localVideoStream?.active ? 1 : 2} rows={[2, -1]}>
							<StreamCard title='Remote Video' slots={{ topLeft: <Timer /> }}>
								<video preload='metadata' style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }} ref={remoteStreamRefCallback}>
									<track kind='captions' />
								</video>
							</StreamCard>
						</CardItem>
					)}
					{localVideoStream?.active && (
						<CardItem columnSpan={remoteVideoStream ? 1 : 2} rows={[2, -1]}>
							<StreamCard title='Local Video'>
								<video preload='metadata' style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }} ref={localStreamRefCallback}>
									<track kind='captions' />
								</video>
							</StreamCard>
						</CardItem>
					)}
				</CardGrid>
				{/* <CardLayout>
					<CardGridSection direction='column'>
						<PeerCard
							displayName={user.displayName}
							avatarUrl={user.avatarUrl}
							muted={muted}
							held={held}
							sharing={localVideoStream?.active ?? false}
						/>
						<PeerCard
							displayName={peerInfo.displayName}
							avatarUrl={peerInfo.avatarUrl}
							muted={remoteMuted}
							held={remoteHeld}
							sharing={remoteVideoStream?.active ?? false}
						/>
					</CardGridSection>
					{streaming && (
						<CardGridSection direction='column'>
							{remoteVideoStream && (
								<StreamCard title='Remote Video' slots={{ topLeft: <Timer /> }}>
									<video
										preload='metadata'
										style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }}
										ref={remoteStreamRefCallback}
									>
										<track kind='captions' />
									</video>
								</StreamCard>
							)}
							{localVideoStream?.active && (
								<StreamCard title='Local Video'>
									<video preload='metadata' style={{ objectFit: 'contain', height: '100%', maxWidth: '100%' }} ref={localStreamRefCallback}>
										<track kind='captions' />
									</video>
								</StreamCard>
							)}
						</CardGridSection>
					)}
				</CardLayout> */}
				{/* <CardGrid direction={streaming ? 'column' : 'row'} id='first-grid' padding='8px'>
					<CardItem columnSpan={streaming ? 1 : 2} rowSpan={streaming ? 2 : 1} id='first-grid-item'>
						<CardGrid direction={streaming ? 'row' : 'column'} id='second-grid'>
							<CardItem id='second-grid-item'>
								<PeerCard
									displayName={user.displayName}
									avatarUrl={user.avatarUrl}
									muted={muted}
									held={held}
									sharing={localVideoStream?.active ?? false}
								/>
							</CardItem>
							<CardItem id='second-grid-item'>
								<PeerCard
									displayName={peerInfo.displayName}
									avatarUrl={peerInfo.avatarUrl}
									muted={remoteMuted}
									held={remoteHeld}
									sharing={remoteVideoStream?.active ?? false}
								/>
							</CardItem>
						</CardGrid>
					</CardItem>
					{streaming && (
						<CardItem columnSpan={2} rowSpan={2} id='third-grid-item'>
							<CardGrid direction='row' id='third-grid'>
								{remoteVideoStream && (
									<CardItem id='fourth-grid-item'>
										<StreamCard title='Remote Video' slots={{ topLeft: <Timer /> }}>
											<video preload='metadata' style={{ objectFit: 'contain', height: '100%' }} ref={remoteStreamRefCallback}>
												<track kind='captions' />
											</video>
										</StreamCard>
									</CardItem>
								)}
								{localVideoStream?.active && (
									<CardItem id='fourth-grid-item'>
										<StreamCard title='Local Video'>
											<video preload='metadata' style={{ objectFit: 'contain', height: '100%' }} ref={localStreamRefCallback}>
												<track kind='captions' />
											</video>
										</StreamCard>
									</CardItem>
								)}
							</CardGrid>
						</CardItem>
					)}
				</CardGrid> */}
			</Box>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexShrink={0} mb={8} w='full'>
				<Box flexGrow={1} color='default' alignContent='center' pis={16}>
					<Timer />
				</Box>
				<ButtonGroup large align='center' style={{ flexGrow: 2 }}>
					{/* <ActionButton disabled={connecting || reconnecting} icon='dialpad' label='Dialpad' {...keypadButtonProps} /> */}
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					<ToggleButton
						label={t('Screen_sharing')}
						icons={['computer', 'computer']}
						titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
						pressed={sharingScreen}
						onToggle={onClickShareScreen}
					/>
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
					{remoteVideoStream && (
						<ToggleButton
							label={t('Chat')}
							icons={['balloon', 'balloon-off']}
							titles={[t('Open_chat'), t('Close_chat')]}
							pressed={showChat}
							onToggle={onToggleChat}
						/>
					)}
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
					<ActionButton label={t('Voice_call__user__hangup', { user: peerInfo.displayName })} icon='phone-off' danger onClick={onEndCall} />
					<DevicePicker />
				</ButtonGroup>
				<Box flexGrow={1} /> {/* TODO: This is a hack to center the buttons */}
			</Box>
			{/* </Box> */}
		</Box>
	);
};

export default memo(RoomCallSection);
