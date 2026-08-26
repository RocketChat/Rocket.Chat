import type { IRoom } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
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
import { useTranslation } from 'react-i18next';

import VideoConfPopupCallerInfo from './VideoConfPopupCallerInfo';
import VideoConfPopupRoomInfo from './VideoConfPopupRoomInfo';
import { useConferenceWindowEnabled } from '../../../../../conference/hooks/useConferenceWindowEnabled';
import { useVideoConfRoomName } from '../../hooks/useVideoConfRoomName';

export type IncomingPopupProps = {
	id: string;
	/** Absent when the call reaches a conference member who has no access to the room it belongs to. */
	room?: IRoom;
	position: number;
	onClose: (id: string) => void;
	onMute: (id: string) => void;
	onConfirm: () => void;
};

const IncomingPopup = ({ id, room, position, onClose, onMute, onConfirm }: IncomingPopupProps) => {
	const { t } = useTranslation();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();
	const roomName = useVideoConfRoomName(room);

	const videoConfInfo = useEndpoint('GET', '/v1/video-conference.info');
	const { data, isPending, isSuccess } = useQuery({
		queryKey: ['getVideoConferenceInfo', id],
		queryFn: async () => videoConfInfo({ callId: id }),
	});

	// The call window asks how to arrive, on a preflight screen where the user can see themselves — so this
	// popup doesn't, and a choice made here seconds earlier isn't quietly overruled there. Without that window
	// this popup is still where mic and camera are chosen.
	const preflight = useConferenceWindowEnabled();
	const showMic = !preflight && Boolean(data?.capabilities?.mic);
	const showCam = !preflight && Boolean(data?.capabilities?.cam);

	// Without the room there is nothing to name the call after until the conference itself loads. Only group
	// conferences carry a title, and `data` is still serialized here, so narrow structurally.
	const conferenceTitle = data && 'title' in data ? data.title : '';

	// A popup with a room is named after the room, which is the only case there is without the call window.
	const callName = room ? roomName : conferenceTitle;

	const handleJoinCall = useStableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfPopup position={position} id={id} aria-label={t('Incoming_call_from__roomName__', { roomName: callName })}>
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
				{room && <VideoConfPopupRoomInfo room={room} />}
				{!room && data && <VideoConfPopupCallerInfo caller={data.createdBy} title={callName} />}
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
