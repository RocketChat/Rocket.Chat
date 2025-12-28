import type { IRoom } from '@rocket.chat/core-typings';
import { useOutsideClick, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	VideoConfPopup,
	VideoConfPopupHeader,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupTitle,
	VideoConfPopupFooterButtons,
	useVideoConfSetPreferences,
	useVideoConfCapabilities,
	useVideoConfPreferences,
} from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import VideoConfPopupRoomInfo from './VideoConfPopupRoomInfo';
import { useVideoConfRoomName } from '../../hooks/useVideoConfRoomName';

type StartCallPopupProps = {
	id: string;
	loading: boolean;
	room: IRoom;
	onClose: () => void;
	onConfirm: () => void;
};

const StartCallPopup = ({ id, loading, room, onClose, onConfirm }: StartCallPopupProps): ReactElement => {
	const { t } = useTranslation();
	const ref = useRef<HTMLElement | null>(null);
	useOutsideClick([ref], !loading ? onClose : () => undefined);

	const setPreferences = useVideoConfSetPreferences();
	const videoConfPreferences = useVideoConfPreferences();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers(videoConfPreferences);
	const capabilities = useVideoConfCapabilities();
	const roomName = useVideoConfRoomName(room);

	const dialogLabel =
		room.t === 'd' ? `${t('Start_a_call_with__roomName__', { roomName })}` : `${t('Start_a_call_in__roomName__', { roomName })}`;

	const showCam = !!capabilities.cam;
	const showMic = !!capabilities.mic;

	const handleStartCall = useEffectEvent(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			ref.current = node;
			node.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					onClose();
				}
			});
		},
		[onClose],
	);

	return (
		<VideoConfPopup ref={callbackRef} id={id} aria-label={dialogLabel}>
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Start_a_call')} />
				{(showCam || showMic) && (
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
					<VideoConfButton disabled={loading} primary onClick={handleStartCall}>
						{t('Start_call')}
					</VideoConfButton>
				</VideoConfPopupFooterButtons>
			</VideoConfPopupFooter>
		</VideoConfPopup>
	);
};

export default StartCallPopup;
