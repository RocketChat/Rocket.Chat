import { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
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
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

import ReactiveUserStatus from '../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../components/avatar/RoomAvatar';

type CallingPopupProps = {
	id: string;
	room: IRoom;
	onClose: (id: string) => void;
};

const CallingPopup = ({ room, onClose, id }: CallingPopupProps): ReactElement => {
	const t = useTranslation();
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const { controllersConfig, handleToggleMic, handleToggleVideo } = useVideoConfControllers();

	return (
		<VideoConfPopup>
			<VideoConfPopupContent>
				{/* Design Team has planned x48 */}
				<RoomAvatar room={room} size='x40' />
				<VideoConfPopupTitle text='Calling' icon='phone-out' counter />
				{directUserId && (
					<Box display='flex' alignItems='center' mbs='x8'>
						<ReactiveUserStatus uid={directUserId} />
						<Box mis='x8' display='flex'>
							<Box>{room.name}</Box>
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
						primary={controllersConfig.video}
						text={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
						title={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
						icon={controllersConfig.video ? 'video' : 'video-off'}
						onClick={handleToggleVideo}
					/>
				</VideoConfPopupControllers>
				<VideoConfPopupFooter>
					{onClose && (
						<VideoConfButton primary icon='phone-disabled' onClick={(): void => onClose(id)}>
							{t('Cancel')}
						</VideoConfButton>
					)}
				</VideoConfPopupFooter>
			</VideoConfPopupContent>
		</VideoConfPopup>
	);
};

export default CallingPopup;
