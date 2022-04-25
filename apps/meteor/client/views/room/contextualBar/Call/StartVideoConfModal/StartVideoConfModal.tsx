import { IRoom } from '@rocket.chat/core-typings';
import { Modal, Box, Button, ButtonGroup, Icon, TextInput, Skeleton } from '@rocket.chat/fuselage';
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
		<Modal maxWidth='x290'>
			<Modal.Content>
				<Box mbs='x32' display='flex' flexDirection='column' alignItems='center'>
					<RoomAvatar room={room} size='x124' />
					<Box fontScale='p2b' mbs='x16'>
						{isDirect ? t('Start_a_call_with') : t('Start_conference_call')}
					</Box>
					<Box display='flex' alignItems='center' mbs='x8'>
						{isDirect && directUserId && (
							<>
								<ReactiveUserStatus uid={directUserId} />
								<Box mis='x8'>{room.name}</Box>
							</>
						)}
						{!isDirect && phase === AsyncStatePhase.LOADING && <Skeleton />}
						{!isDirect && value?.room.usersCount && t('__userCount__people_will_be_invited', { userCount: value.room.usersCount - 1 })}
					</Box>
					<ButtonGroup mbs='x24'>
						<Box display='flex' flexDirection='column' alignItems='center' mie='x12'>
							<Button
								title={startCallConfig.mic ? t('Mic_on') : t('Mic_off')}
								square
								primary={startCallConfig.mic}
								onClick={handleToggleMic}
							>
								<Icon size='x20' name={startCallConfig.mic ? 'mic' : 'mic-off'} />
							</Button>
							<Box mbs='x8' fontScale='c1' color='neutral-700'>
								{startCallConfig.mic ? t('Mic_on') : t('Mic_off')}
							</Box>
						</Box>

						<Box display='flex' flexDirection='column' alignItems='center' mis='x12'>
							<Button
								title={startCallConfig.video ? t('Cam_on') : t('Cam_off')}
								square
								primary={startCallConfig.video}
								onClick={handleToggleVideo}
							>
								<Icon size='x20' name={startCallConfig.video ? 'video' : 'video-off'} />
							</Button>
							<Box mbs='x8' fontScale='c1' color='neutral-700'>
								{startCallConfig.video ? t('Cam_on') : t('Cam_off')}
							</Box>
						</Box>
					</ButtonGroup>

					{!isDirect && (
						<Box width='full' mbs='x24'>
							<TextInput
								width='full'
								placeholder={t('Conference_name')}
								value={confName}
								onChange={(e: ChangeEvent<HTMLInputElement>): void => setConfName(e.target.value)}
							/>
						</Box>
					)}
				</Box>
			</Modal.Content>
			<ButtonGroup m='x32' mbs='x24' vertical stretch>
				<Button primary>
					<Icon size='x20' name='phone' /> {t('Start_call')}
				</Button>
				<Button onClick={onClose}>{t('Cancel')}</Button>
			</ButtonGroup>
		</Modal>
	);
};

export default StartVideoConfModal;
