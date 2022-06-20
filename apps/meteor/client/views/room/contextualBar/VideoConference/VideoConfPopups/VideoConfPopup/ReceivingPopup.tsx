import { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import {
	VideoConfPopup,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupTitle,
	VideoConfPopupIndicators,
	VideoConfPopupClose,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

import ReactiveUserStatus from '../../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../../components/avatar/RoomAvatar';
import { useVideoConfSetPreferences } from '../../../../../../contexts/VideoConfContext';

type ReceivingPopupProps = {
	id: string;
	room: IRoom;
	position: number;
	current: number;
	total: number;
	onClose: (id: string) => void;
	onMute: (id: string) => void;
	onConfirm: () => void;
};

const ReceivingPopup = ({ id, room, position, current, total, onClose, onMute, onConfirm }: ReceivingPopupProps): ReactElement => {
	const t = useTranslation();
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();

	const handleJoinCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfPopup position={position}>
			<VideoConfPopupContent>
				{/* Design Team has planned x48 */}
				<VideoConfPopupClose title={t('Close')} onClick={(): void => onMute(id)} />
				<RoomAvatar room={room} size='x40' />
				{current && total ? <VideoConfPopupIndicators current={current} total={total} /> : null}
				<VideoConfPopupTitle text='Incoming call from' icon='phone-in' />
				{directUserId && (
					<Box display='flex' alignItems='center' mbs='x8'>
						<ReactiveUserStatus uid={directUserId} />
						<Box mis='x8' display='flex'>
							<Box>{room.fname}</Box>
							<Box mis='x4' color='neutral-600'>
								(object Object)
							</Box>
						</Box>
					</Box>
				)}
				<VideoConfPopupControllers>
					<VideoConfController
						primary={controllersConfig.mic}
						text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
						title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
						icon={controllersConfig.mic ? 'mic' : 'mic-off'}
						onClick={handleToggleMic}
					/>
					<VideoConfController
						primary={controllersConfig.cam}
						text={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
						title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
						icon={controllersConfig.cam ? 'video' : 'video-off'}
						onClick={handleToggleCam}
					/>
				</VideoConfPopupControllers>
				<VideoConfPopupFooter>
					<VideoConfButton primary onClick={handleJoinCall}>
						{t('Accept')}
					</VideoConfButton>
					{onClose && (
						<VideoConfButton danger onClick={(): void => onClose(id)}>
							{t('Decline')}
						</VideoConfButton>
					)}
				</VideoConfPopupFooter>
			</VideoConfPopupContent>
		</VideoConfPopup>
	);
};

export default ReceivingPopup;
