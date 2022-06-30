import { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
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
	VideoConfPopupTitle,
	VideoConfPopupFooterButtons,
	VideoConfPopupUsername,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, forwardRef, Ref } from 'react';

import ReactiveUserStatus from '../../../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../../../components/avatar/RoomAvatar';
import {
	useVideoConfSetPreferences,
	useVideoConfCapabilities,
	useVideoConfPreferences,
} from '../../../../../../../contexts/VideoConfContext';

type StartDirectCallPopup = {
	room: IRoom;
	onConfirm: () => void;
	loading: boolean;
};

const StartDirectCallPopup = forwardRef(function StartDirectCallPopup(
	{ room, onConfirm, loading }: StartDirectCallPopup,
	ref: Ref<HTMLDivElement>,
): ReactElement {
	const t = useTranslation();
	const user = useUser();
	const userId = user?._id;
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const [directUsername] = room.usernames?.filter((username) => username !== user?.username) || [];

	const videoConfPreferences = useVideoConfPreferences();
	const setPreferences = useVideoConfSetPreferences();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers(videoConfPreferences);
	const capabilities = useVideoConfCapabilities();

	const showCam = !!capabilities.cam;
	const showMic = !!capabilities.mic;

	const handleStartCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfPopup ref={ref}>
			<VideoConfPopupContent>
				<RoomAvatar room={room} size='x40' />
				<VideoConfPopupTitle text={t('Start_a_call')} />
				{directUserId && (
					<Box display='flex' alignItems='center' mbs='x8'>
						<ReactiveUserStatus uid={directUserId} />
						{directUsername && <VideoConfPopupUsername username={directUsername} />}
					</Box>
				)}
				{(showCam || showMic) && (
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
					<VideoConfButton disabled={loading} primary onClick={handleStartCall}>
						{t('Start_call')}
					</VideoConfButton>
				</VideoConfPopupFooterButtons>
			</VideoConfPopupFooter>
		</VideoConfPopup>
	);
});

export default StartDirectCallPopup;
