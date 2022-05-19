import { IRoom } from '@rocket.chat/core-typings';
import { Skeleton, Avatar, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfModalFooter,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfController,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useMemo } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';

type JoinVideoConfModalProps = {
	room: IRoom;
	onClose: () => void;
	onConfirm: () => void;
};

const MAX_USERS = 2;

const JoinVideoConfModal = ({ room, onClose, onConfirm }: JoinVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const rid = room._id;
	const { controllersConfig, handleToggleMic, handleToggleVideo } = useVideoConfControllers();

	const params = useMemo(() => ({ roomId: rid }), [rid]);

	// TODO: Experimental only, this data will come from the new collection
	const { phase, value } = useEndpointData(`${room.t === 'c' ? 'channels.members' : 'groups.members'}`, params);

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{t('Join_conference__name__', { name: 'My Conf' })}</VideoConfModalTitle>
				<VideoConfModalInfo>
					{phase === AsyncStatePhase.LOADING && <Skeleton />}
					<Box display='flex' flexDirection='column' alignItems='center'>
						{value?.members && value.members.length > 0 && (
							<Avatar.Stack>
								{value.members.map(
									(member, index) =>
										index + 1 <= MAX_USERS && <UserAvatar key={member._id} username={member.username || ''} etag={member.avatarETag} />,
								)}
							</Avatar.Stack>
						)}
						<Box mbs='x8' fontScale='c1' color='neutral-700'>
							{t('__usersCount__members_joined', { usersCount: value?.members && value.members.length - MAX_USERS })}
						</Box>
					</Box>
				</VideoConfModalInfo>
				<VideoConfModalControllers>
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
				</VideoConfModalControllers>
			</VideoConfModalContent>
			<VideoConfModalFooter>
				<VideoConfButton onClick={onConfirm} primary>
					{t('join')}
				</VideoConfButton>
				<VideoConfButton onClick={onClose}>{t('Cancel')}</VideoConfButton>
			</VideoConfModalFooter>
		</VideoConfModal>
	);
};

export default JoinVideoConfModal;
