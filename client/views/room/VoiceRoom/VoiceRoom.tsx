import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';

import VoiceRoomManager, {
	isMediasoupState,
	isWsState,
	useVoiceChannel,
} from '../../../../app/voice-channel/client/VoiceChannelManager';
import { IRoom } from '../../../../definition/IRoom';
import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
// import { useVoiceRoomContext } from '../contexts/VoiceRoomContext';
import VoicePeersList from './VoicePeersList';
// import { protooConnectionWithVoiceRoomClient, addListenersToMediasoupClient } from './util';

interface IVoiceRoom {
	room: IRoom;
	rid: string;
}

const VoiceRoom: FC<IVoiceRoom> = ({ room, rid }): ReactElement => {
	const state = useVoiceChannel();
	// const [connected, setConnected] = useState(false);
	const [muteMic, setMuteMic] = useState(false);
	const [deafen, setDeafen] = useState(false);

	const setModal = useSetModal();
	const t = useTranslation();

	const closeModal = useMutableCallback(() => setModal(null));

	// const handleConnection = async (type: 'mediasoup' | 'ws'): Promise<void> => {
	// 	try {
	// 		if (type === 'mediasoup') {
	// 			if (mediasoupClient) {
	// 				mediasoupClient.close();
	// 			}
	// 			await protooConnectionWithVoiceRoomClient(room, setMediasoupPeers, setMediasoupClient);
	// 		} else {
	// 			if (wsClient) {
	// 				wsClient.close();
	// 			}
	// 			await protooConnectionWithVoiceRoomClient(room, setWsPeers, setWsClient);
	// 		}
	// 	} catch (err) {
	// 		console.error(err);
	// 	}
	// };

	const handleDisconnect = (): void => {
		// setConnected(false);
		// handleConnection('mediasoup');
		VoiceRoomManager.disconnect(rid, room);
	};

	const toggleMic = (): void => {
		if (isMediasoupState(state)) {
			setMuteMic((prev) => {
				if (prev) {
					state.mediasoupClient.unmuteMic();
				} else {
					state.mediasoupClient.muteMic();
				}
				return !prev;
			});
		}
	};

	const toggleDeafen = (): void => setDeafen((prev) => !prev);

	const join = useCallback(() => {
		VoiceRoomManager.joinRoom(rid);
	}, []);
	const handleModalConfirm = async (): Promise<void> => {
		// mediasoupClient?.close();
		// setMediasoupPeers(wsPeers);
		// wsClient?.removeAllListeners();
		// if (wsClient) {
		// 	addListenersToMediasoupClient(wsClient, setMediasoupPeers);
		// }
		// await wsClient?.joinRoom();
		// setMediasoupClient(wsClient);
		// setWsClient(null);
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

	const fn = useCallback(() => {
		VoiceRoomManager.connect(rid, room);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rid]);

	useEffect(() => {
		fn();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rid]);

	useEffect(() => {
		console.log(state);
	}, [state]);

	return (
		<Box display='flex' flexDirection='column' height='full' justifyContent='space-between'>
			{isWsState(state) && <VoicePeersList peers={state.wsClient.peers} deafen={deafen} />}

			{isMediasoupState(state) && state.rid === rid && (
				<Box display={state.rid !== rid ? 'none' : 'block'}>
					<VoicePeersList peers={state.mediasoupClient.peers} deafen={deafen} />
				</Box>
			)}

			<Box display='flex' justifyContent='center' alignItems='center' pb='x24'>
				{isMediasoupState(state) && state.rid === rid ? (
					<ButtonGroup>
						<Button square onClick={toggleMic}>
							{muteMic ? <Icon name='mic-off' size='x24' /> : <Icon name='mic' size='x24' />}
						</Button>
						<Button primary danger square onClick={handleDisconnect}>
							<Icon name='phone-off' size='x24' />
						</Button>
						<Button square onClick={toggleDeafen}>
							{deafen ? (
								<Icon name='headphone-off' size='x24' />
							) : (
								<Icon name='headphone' size='x24' />
							)}
						</Button>
					</ButtonGroup>
				) : (
					<Button primary success square onClick={handleJoin}>
						<Icon name='phone' size='x24' />
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default VoiceRoom;
