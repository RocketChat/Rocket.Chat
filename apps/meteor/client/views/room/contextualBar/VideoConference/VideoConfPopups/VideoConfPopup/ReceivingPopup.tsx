import { IRoom } from '@rocket.chat/core-typings';
import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUser } from '@rocket.chat/ui-contexts';
import {
	VideoConfPopup,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupFooterButtons,
	VideoConfPopupTitle,
	VideoConfPopupIndicators,
	VideoConfPopupClose,
	VideoConfPopupUsername,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useMemo } from 'react';

import ReactiveUserStatus from '../../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../../components/avatar/RoomAvatar';
import { useVideoConfSetPreferences } from '../../../../../../contexts/VideoConfContext';
import { AsyncStatePhase } from '../../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../../hooks/useEndpointData';

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
	const user = useUser();
	const userId = user?._id;
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const [directUsername] = room.usernames?.filter((username) => username !== user?.username) || [];

	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();

	const params = useMemo(() => ({ callId: id }), [id]);
	const { phase, value } = useEndpointData('/v1/video-conference.info', params);
	const showMic = Boolean(value?.capabilities?.mic);
	const showCam = Boolean(value?.capabilities?.cam);

	const handleJoinCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfPopup position={position}>
			<VideoConfPopupContent>
				<VideoConfPopupClose title={t('Close')} onClick={(): void => onMute(id)} />
				<RoomAvatar room={room} size='x40' />
				{current && total ? <VideoConfPopupIndicators current={current} total={total} /> : null}
				<VideoConfPopupTitle text='Incoming call from' icon='phone-in' />
				{directUserId && (
					<Box display='flex' alignItems='center' mbs='x8'>
						<ReactiveUserStatus uid={directUserId} />
						{directUsername && <VideoConfPopupUsername username={directUsername} />}
					</Box>
				)}
				{phase === AsyncStatePhase.LOADING && <Skeleton />}
				{phase === AsyncStatePhase.RESOLVED && (showMic || showCam) && (
					<VideoConfPopupControllers>
						{showMic && (
							<VideoConfController
								active={controllersConfig.mic}
								text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								icon={controllersConfig.mic ? 'mic' : 'mic-off'}
								onClick={handleToggleMic}
							/>
						)}
						{showCam && (
							<VideoConfController
								active={controllersConfig.cam}
								text={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								icon={controllersConfig.cam ? 'video' : 'video-off'}
								onClick={handleToggleCam}
							/>
						)}
					</VideoConfPopupControllers>
				)}
			</VideoConfPopupContent>
			<VideoConfPopupFooter>
				<VideoConfPopupFooterButtons>
					<VideoConfButton primary onClick={handleJoinCall}>
						{t('Accept')}
					</VideoConfButton>
					{onClose && (
						<VideoConfButton danger onClick={(): void => onClose(id)}>
							{t('Decline')}
						</VideoConfButton>
					)}
				</VideoConfPopupFooterButtons>
			</VideoConfPopupFooter>
		</VideoConfPopup>
	);
};

export default ReceivingPopup;
