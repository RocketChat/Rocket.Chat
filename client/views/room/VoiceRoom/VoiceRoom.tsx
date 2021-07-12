import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactElement, useEffect, useState } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useVoiceRoomContext } from '../contexts/VoiceRoomContext';
import VoicePeersList from './VoicePeersList';
import { protooConnectionWithVoiceRoomClient, addListenersToMediasoupClient } from './util';

interface IVoiceRoom {
	room: IRoom;
	rid: string;
}

const VoiceRoom: FC<IVoiceRoom> = ({ room, rid }): ReactElement => {
	const {
		mediasoupClient,
		mediasoupPeers,
		setMediasoupPeers,
		setMediasoupClient,
		wsClient,
		wsPeers,
		setWsPeers,
		setWsClient,
	} = useVoiceRoomContext();

	const [connected, setConnected] = useState(mediasoupClient?.joined || false);
	const [muteMic, setMuteMic] = useState(false);
	const [deafen, setDeafen] = useState(false);

	const setModal = useSetModal();
	const t = useTranslation();

	const closeModal = useMutableCallback(() => setModal(null));

	const handleConnection = async (type: 'mediasoup' | 'ws'): Promise<void> => {
		try {
			if (type === 'mediasoup') {
				if (mediasoupClient) {
					mediasoupClient.close();
				}
				await protooConnectionWithVoiceRoomClient(room, setMediasoupPeers, setMediasoupClient);
			} else {
				if (wsClient) {
					wsClient.close();
				}
				await protooConnectionWithVoiceRoomClient(room, setWsPeers, setWsClient);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleDisconnect = (): void => {
		setConnected(false);
		handleConnection('mediasoup');
	};

	const toggleMic = (): void => {
		setMuteMic((prev) => {
			if (prev) {
				mediasoupClient?.unmuteMic();
			} else {
				mediasoupClient?.muteMic();
			}

			return !prev;
		});
	};

	const toggleDeafen = (): void => setDeafen((prev) => !prev);

	const join = async (): Promise<void> => {
		try {
			await mediasoupClient?.joinRoom();
			setConnected(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleModalConfirm = async (): Promise<void> => {
		mediasoupClient?.close();
		setMediasoupPeers(wsPeers);
		wsClient?.removeAllListeners();
		if (wsClient) {
			addListenersToMediasoupClient(wsClient, setMediasoupPeers);
		}
		await wsClient?.joinRoom();
		setMediasoupClient(wsClient);
		setWsClient(null);
		closeModal();
	};

	const handleJoin = (): void => {
		if (wsClient && mediasoupClient?.roomID !== rid) {
			setModal(
				<GenericModal
					variant='warning'
					children={t('You_will_be_disconnected_from_channel', {
						roomName: mediasoupClient?.roomName,
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
		if (!mediasoupClient || !mediasoupClient.joined) {
			handleConnection('mediasoup');
		}

		if (mediasoupClient && mediasoupClient.joined) {
			if (mediasoupClient.roomID !== rid && wsClient?.roomID !== rid) {
				handleConnection('ws');
			} else {
				wsClient?.close();
				setWsClient(null);
			}
		}
	}, [rid]);

	return (
		<Box display='flex' flexDirection='column' height='full' justifyContent='space-between'>
			{mediasoupClient?.roomID !== room._id && <VoicePeersList peers={wsPeers} deafen={deafen} />}

			<Box display={mediasoupClient?.roomID !== rid ? 'none' : 'block'}>
				<VoicePeersList peers={mediasoupPeers} deafen={deafen} />
			</Box>

			<Box display='flex' justifyContent='center' alignItems='center' pb='x24'>
				{connected && mediasoupClient?.roomID === rid ? (
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
