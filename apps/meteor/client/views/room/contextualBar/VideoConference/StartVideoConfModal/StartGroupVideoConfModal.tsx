import { IRoom } from '@rocket.chat/core-typings';
import { TextInput, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfModalController,
	VideoConfModalFooter,
	VideoConfModalControllerButton,
	VideoConfModalFooterButton,
	useVideoConfControllers,
	VideoConfModalField,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useMemo, useState, ChangeEvent } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';

type StartGroupVideoConfModalProps = {
	room: IRoom;
	onClose: () => void;
};

const StartGroupVideoConfModal = ({ room, onClose }: StartGroupVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const rid = room._id;
	const [confName, setConfName] = useState<string | undefined>(undefined);
	const { controllersConfig, handleToggleMic, handleToggleVideo } = useVideoConfControllers();

	const params = useMemo(() => ({ roomId: rid }), [rid]);
	const { phase, value } = useEndpointData('rooms.info', params);

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{t('Start_conference_call')}</VideoConfModalTitle>
				<VideoConfModalInfo>
					{phase === AsyncStatePhase.LOADING && <Skeleton />}
					{value?.room.usersCount && t('__userCount__people_will_be_invited', { userCount: value.room.usersCount - 1 })}
				</VideoConfModalInfo>
				<VideoConfModalControllers>
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={controllersConfig.mic}
							text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
							title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
							icon={controllersConfig.mic ? 'mic' : 'mic-off'}
							onClick={handleToggleMic}
						/>
					</VideoConfModalController>
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={controllersConfig.video}
							text={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
							title={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
							icon={controllersConfig.video ? 'video' : 'video-off'}
							onClick={handleToggleVideo}
						/>
					</VideoConfModalController>
				</VideoConfModalControllers>
				<VideoConfModalField>
					<TextInput
						width='full'
						placeholder={t('Conference_name')}
						value={confName}
						onChange={(e: ChangeEvent<HTMLInputElement>): void => setConfName(e.target.value)}
					/>
				</VideoConfModalField>
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

export default StartGroupVideoConfModal;
