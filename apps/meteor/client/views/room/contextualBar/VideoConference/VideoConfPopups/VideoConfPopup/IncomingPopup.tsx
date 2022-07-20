import { IRoom } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
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
	VideoConfPopupHeader,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useMemo } from 'react';

import { useVideoConfSetPreferences } from '../../../../../../contexts/VideoConfContext';
import { AsyncStatePhase } from '../../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../../hooks/useEndpointData';
import VideoConfPopupRoomInfo from './VideoConfPopupRoomInfo';

type IncomingPopupProps = {
	id: string;
	room: IRoom;
	position: number;
	onClose: (id: string) => void;
	onMute: (id: string) => void;
	onConfirm: () => void;
};

const IncomingPopup = ({ id, room, position, onClose, onMute, onConfirm }: IncomingPopupProps): ReactElement => {
	const t = useTranslation();
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
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Incoming_call_from')} />
				{phase === AsyncStatePhase.LOADING && <Skeleton />}
				{phase === AsyncStatePhase.RESOLVED && (showMic || showCam) && (
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
