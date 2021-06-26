import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactElement, useEffect, useState } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import WarningModal from '../../admin/apps/WarningModal';
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
		await wsClient?.joinRoom();
		setMediasoupPeers(wsPeers);
		wsClient?.removeAllListeners();
		if (wsClient) {
			addListenersToMediasoupClient(wsClient, setMediasoupPeers);
		}
		setMediasoupClient(wsClient);
		setWsClient(null);
		closeModal();
	};

	const handleJoin = (): void => {
		if (wsClient && mediasoupClient?.roomID !== rid) {
			setModal(
				<WarningModal
					text={`You will be disconnected from ${mediasoupClient?.roomName} channel.`}
					confirmText={t('Yes')}
					close={closeModal}
					cancel={closeModal}
					cancelText={t('Cancel')}
					confirm={handleModalConfirm}
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
		<>
			{mediasoupClient?.roomID !== room._id && <VoicePeersList peers={wsPeers} deafen={deafen} />}
			<Box display={mediasoupClient?.roomID !== rid ? 'none' : 'block'}>
				<VoicePeersList peers={mediasoupPeers} deafen={deafen} />
			</Box>
			<Box
				display='flex'
				position='fixed'
				style={{
					bottom: 0,
					left: 0,
					right: 0,
				}}
				justifyContent='center'
				alignItems='center'
				pb='x24'
			>
				{connected && mediasoupClient?.roomID === rid ? (
					<ButtonGroup>
						<Button square onClick={toggleMic}>
							{muteMic ? <Icon name='mic-off' size='x24' /> : <Icon name='mic' size='x24' />}
						</Button>
						<Button primary danger square onClick={handleDisconnect}>
							<Icon name='phone-off' size='x24' />
						</Button>
						<Button square onClick={toggleDeafen}>
							{deafen ? <Icon name='headset-off' size='x24' /> : <Icon name='headset' size='x24' />}
						</Button>
					</ButtonGroup>
				) : (
					<Button primary success square onClick={handleJoin}>
						<Icon name='phone' size='x24' />
					</Button>
				)}
			</Box>
		</>
	);
};

export default VoiceRoom;
