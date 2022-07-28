import { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, ReactElement } from 'react';

import { getAvatarURL } from '../../../app/utils/lib/getAvatarURL';
import { useFileInput } from '../../hooks/useFileInput';
import RoomAvatar from './RoomAvatar';

type RoomAvatarEditorProps = {
	room: Pick<IRoom, RoomAdminFieldsType>;
	roomAvatar?: string;
	onChangeAvatar: (url: string | null) => void;
};

const RoomAvatarEditor = ({ room, roomAvatar, onChangeAvatar }: RoomAvatarEditorProps): ReactElement => {
	const t = useTranslation();

	const handleChangeAvatar = useMutableCallback((file) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = (): void => {
			if (typeof reader.result === 'string') {
				onChangeAvatar(reader.result);
			}
		};
	});

	const [clickUpload, reset] = useFileInput(handleChangeAvatar);
	const clickReset = useMutableCallback(() => {
		reset();
		onChangeAvatar(null);
	});

	useEffect(() => {
		!roomAvatar && reset();
	}, [roomAvatar, reset]);

	const defaultUrl = room.prid ? getAvatarURL({ roomId: room.prid }) : getAvatarURL({ username: `@${room.name}` }); // Discussions inherit avatars from the parent room

	return (
		<Box borderRadius='x2' maxWidth='x332' w='full' position='relative'>
			<RoomAvatar {...(roomAvatar !== undefined && { url: roomAvatar === null ? defaultUrl : roomAvatar })} room={room} size='x332' />
			<Box
				className={[
					css`
						bottom: 0;
						right: 0;
					`,
				]}
				position='absolute'
				m='x12'
			>
				<ButtonGroup>
					<Button small title={t('Upload_user_avatar')} onClick={clickUpload}>
						<Icon name='upload' size='x16' />
						{t('Upload')}
					</Button>

					<Button primary small danger title={t('Accounts_SetDefaultAvatar')} disabled={roomAvatar === null} onClick={clickReset}>
						<Icon name='trash' size='x16' />
					</Button>
				</ButtonGroup>
			</Box>
		</Box>
	);
};

export default RoomAvatarEditor;
