import type { IRoom } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import {
	useVideoConfSetPreferences,
	VideoConfPopup,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupFooterButtons,
	VideoConfPopupTitle,
	VideoConfPopupHeader,
} from '@rocket.chat/ui-video-conf';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import VideoConfPopupRoomInfo from './VideoConfPopupRoomInfo';
import { useVideoConfRoomName } from '../../hooks/useVideoConfRoomName';

type IncomingPopupProps = {
	id: string;
	room: IRoom;
	position: number;
	onClose: (id: string) => void;
	onMute: (id: string) => void;
	onConfirm: () => void;
};

const IncomingPopup = ({ id, room, position, onClose, onMute, onConfirm }: IncomingPopupProps): ReactElement => {
	const { t } = useTranslation();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();
	const roomName = useVideoConfRoomName(room);

	const videoConfInfo = useEndpoint('GET', '/v1/video-conference.info');
	const { data, isPending, isSuccess } = useQuery({
		queryKey: ['getVideoConferenceInfo', id],
		queryFn: async () => videoConfInfo({ callId: id }),
	});

	const showMic = Boolean(data?.capabilities?.mic);
	const showCam = Boolean(data?.capabilities?.cam);

	const handleJoinCall = useEffectEvent(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfPopup position={position} id={id} aria-label={t('Incoming_call_from__roomName__', { roomName })}>
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Incoming_call_from')} />
				{isPending && <Skeleton />}
				{isSuccess && (showMic || showCam) && (
					<VideoConfPopupControllers>
						{showCam && (
							<VideoConfController
								active={controllersConfig.cam}
								title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								icon={controllersConfig.cam ? 'video' : 'video-off'}
								onClick={handleToggleCam}
							/>
						)}
						{showMic && (
							<VideoConfController
								active={controllersConfig.mic}
								title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								icon={controllersConfig.mic ? 'mic' : 'mic-off'}
								onClick={handleToggleMic}
							/>
						)}
					</VideoConfPopupControllers>
				)}
			</VideoConfPopupHeader>
			<VideoConfPopupContent>
				<VideoConfPopupRoomInfo room={room} />
			</VideoConfPopupContent>
			<VideoConfPopupFooter>
				<VideoConfPopupFooterButtons>
					<VideoConfButton primary onClick={handleJoinCall}>
						{t('Accept')}
					</VideoConfButton>
					{onClose && (
						<VideoConfButton danger secondary onClick={(): void => onClose(id)}>
							{t('Decline')}
						</VideoConfButton>
					)}
					<VideoConfController small={false} secondary title={t('Mute_and_dismiss')} icon='cross' onClick={(): void => onMute(id)} />
				</VideoConfPopupFooterButtons>
			</VideoConfPopupFooter>
		</VideoConfPopup>
	);
};

export default IncomingPopup;
