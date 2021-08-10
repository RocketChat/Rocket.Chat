import { Box, Button, ButtonGroup, Callout, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactElement, useEffect, useState } from 'react';

import VoiceRoomManager, {
	isMediasoupState,
	isWsState,
	useMediasoupPeers,
	useVoiceChannel,
	useWsPeers,
	useVoiceChannelMic,
	useVoiceChannelDeafen,
} from '../../../../app/voice-channel/client/VoiceChannelManager';
import { IRoom } from '../../../../definition/IRoom';
import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import VoicePeersList from './VoicePeersList';

interface IVoiceRoom {
	room: IRoom;
	rid: string;
}

const VoiceRoom: FC<IVoiceRoom> = ({ rid, room }): ReactElement => {
	const state = useVoiceChannel();
	const mediasoupPeers = useMediasoupPeers();
	const wsPeers = useWsPeers();
	const [showCallout, setCallout] = useState(false);
	const muted = useVoiceChannelMic();
	const globalDeafen = useVoiceChannelDeafen();

	const setModal = useSetModal();
	const t = useTranslation();

	const closeModal = useMutableCallback(() => setModal(null));

	const toggleMic = (): void => {
		VoiceRoomManager.toggleMic();
	};

	const toggleDeafen = (): void => VoiceRoomManager.toggleDeafen();

	const join = (): void => VoiceRoomManager.joinRoom(rid);

	const connectVoiceRoom = (): void => VoiceRoomManager.connect(rid, room);

	const handleDisconnect = (): void => {
		VoiceRoomManager.disconnect();
		connectVoiceRoom();
	};

	const handleModalConfirm = async (): Promise<void> => {
		handleDisconnect();
		// @TODO: set correct timer OR move to await
		setTimeout(() => join(), 500);
		closeModal();
	};

	const handleJoin = (): void => {
		if (isMediasoupState(state)) {
			setModal(
				<GenericModal
					variant='warning'
					children={t('You_will_be_disconnected_from_channel', {
						roomName: state.mediasoupClient.roomName,
					})}
					confirmText={t('Disconnect')}
					cancelText={t('Cancel')}
					onClose={closeModal}
					onCancel={closeModal}
					onConfirm={handleModalConfirm}
				/>,
			);
			return;
		}

		join();
	};

	useEffect(() => {
		connectVoiceRoom();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rid]);

	useEffect(() => {
		if (state.state === 'error') {
			setCallout(true);
			setTimeout(() => {
				setCallout(false);
				connectVoiceRoom();
			}, 2000);
		}

		if (state.state === 'disconnected' || state.state === 'notStarted') {
			connectVoiceRoom();
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.state]);
	console.log(state);

	return (
		<Box
			display={!room.voice ? 'none' : 'flex'}
			flexDirection='column'
			height='full'
			justifyContent='space-between'
		>
			{showCallout && (
				<Callout type='danger' title='Error connecting to voice channel. Please try again' />
			)}
			{(isWsState(state) ||
				((isWsState(state) || isMediasoupState(state)) && state.rid !== rid)) && (
				<VoicePeersList peers={wsPeers} globalDeafen={globalDeafen} />
			)}

			{isMediasoupState(state) && (
				<Box display={state.rid !== rid ? 'none' : 'block'}>
					<VoicePeersList peers={mediasoupPeers} globalDeafen={globalDeafen} />
				</Box>
			)}

			<Box display='flex' justifyContent='center' alignItems='center' pb='x24'>
				{isMediasoupState(state) && state.rid === rid && state.state === 'connected' ? (
					<ButtonGroup>
						<Button square onClick={toggleMic}>
							{muted ? <Icon name='mic-off' size='x24' /> : <Icon name='mic' size='x24' />}
						</Button>
						<Button primary danger square onClick={handleDisconnect}>
							<Icon name='phone-off' size='x24' />
						</Button>
						<Button square onClick={toggleDeafen}>
							{globalDeafen ? (
								<Icon name='headphone-off' size='x24' />
							) : (
								<Icon name='headphone' size='x24' />
							)}
						</Button>
					</ButtonGroup>
				) : (
					state.state === 'wsconnected' && (
						<Button primary success square onClick={handleJoin}>
							<Icon name='phone' size='x24' />
						</Button>
					)
				)}
			</Box>
		</Box>
	);
};

export default VoiceRoom;
