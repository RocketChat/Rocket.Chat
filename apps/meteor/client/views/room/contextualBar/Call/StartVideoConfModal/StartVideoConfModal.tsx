import { IRoom } from '@rocket.chat/core-typings';
import { Box, TextInput, Skeleton } from '@rocket.chat/fuselage';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfModalController,
	VideoConfModalFooter,
	VideoConfModalField,
	VideoConfModalControllerButton,
	VideoConfModalFooterButton,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ChangeEvent, useMemo } from 'react';

import ReactiveUserStatus from '../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserId } from '../../../../../contexts/UserContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';

const StartVideoConfModal = ({ room, onClose }: { room: IRoom; onClose: () => void }): ReactElement => {
	const t = useTranslation();
	const userId = useUserId();
	const rid = room._id;
	const [startCallConfig, setStartCallConfig] = useState({ mic: true, video: false });
	const [confName, setConfName] = useState<string | undefined>(undefined);
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const isDirect = room.t === 'd' && (room.uids?.length ?? 0) < 3;

	const params = useMemo(() => ({ roomId: rid }), [rid]);
	const { phase, value } = useEndpointData('rooms.info', params);

	const handleToggleMic = (): void => {
		setStartCallConfig((prevState) => ({ ...prevState, mic: !startCallConfig.mic }));
	};

	const handleToggleVideo = (): void => {
		setStartCallConfig((prevState) => ({ ...prevState, video: !startCallConfig.video }));
	};

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{isDirect ? t('Start_a_call_with') : t('Start_conference_call')}</VideoConfModalTitle>
				<VideoConfModalInfo>
					{isDirect && directUserId && (
						<>
							<ReactiveUserStatus uid={directUserId} />
							<Box mis='x8'>{room.name}</Box>
						</>
					)}
					{!isDirect && phase === AsyncStatePhase.LOADING && <Skeleton />}
					{!isDirect && value?.room.usersCount && t('__userCount__people_will_be_invited', { userCount: value.room.usersCount - 1 })}
				</VideoConfModalInfo>
				<VideoConfModalControllers>
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={startCallConfig.mic}
							text={startCallConfig.mic ? t('Mic_on') : t('Mic_off')}
							title={startCallConfig.mic ? t('Mic_on') : t('Mic_off')}
							icon={startCallConfig.mic ? 'mic' : 'mic-off'}
							onClick={handleToggleMic}
						/>
					</VideoConfModalController>
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={startCallConfig.video}
							text={startCallConfig.video ? t('Cam_on') : t('Cam_off')}
							title={startCallConfig.video ? t('Cam_on') : t('Cam_off')}
							icon={startCallConfig.video ? 'video' : 'video-off'}
							onClick={handleToggleVideo}
						/>
					</VideoConfModalController>
				</VideoConfModalControllers>
				{!isDirect && (
					<VideoConfModalField>
						<TextInput
							width='full'
							placeholder={t('Conference_name')}
							value={confName}
							onChange={(e: ChangeEvent<HTMLInputElement>): void => setConfName(e.target.value)}
						/>
					</VideoConfModalField>
				)}
			</VideoConfModalContent>
			<VideoConfModalFooter>
				<VideoConfModalFooterButton primary icon='phone'>
					{t('Start_call')}
				</VideoConfModalFooterButton>
				<VideoConfModalFooterButton onClick={onClose}>{t('Cancel')}</VideoConfModalFooterButton>
			</VideoConfModalFooter>
		</VideoConfModal>
	);
};

export default StartVideoConfModal;
