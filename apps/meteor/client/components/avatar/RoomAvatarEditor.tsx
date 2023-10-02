import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { getAvatarURL } from '../../../app/utils/client/getAvatarURL';
import { useFileInput } from '../../hooks/useFileInput';
import { isValidImageFormat } from '../../lib/utils/isValidImageFormat';
import RoomAvatar from './RoomAvatar';

type RoomAvatarEditorProps = {
	room: Pick<IRoom, RoomAdminFieldsType>;
	disabled?: boolean;
	roomAvatar?: string;
	onChangeAvatar: (url: string | null) => void;
};

const RoomAvatarEditor = ({ disabled = false, room, roomAvatar, onChangeAvatar }: RoomAvatarEditorProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleChangeAvatar = useMutableCallback(async (file) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = async (): Promise<void> => {
			const { result } = reader;
			if (typeof result === 'string' && (await isValidImageFormat(result))) {
				onChangeAvatar(result);
				return;
			}
			dispatchToastMessage({ type: 'error', message: t('Avatar_format_invalid') });
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
				m={12}
			>
				<ButtonGroup>
					<Button icon='upload' disabled={isRoomFederated(room) || disabled} small title={t('Upload_user_avatar')} onClick={clickUpload}>
						{t('Upload')}
					</Button>

					<Button
						small
						danger
						icon='trash'
						title={t('Accounts_SetDefaultAvatar')}
						disabled={roomAvatar === null || isRoomFederated(room) || disabled}
						onClick={clickReset}
					/>
				</ButtonGroup>
			</Box>
		</Box>
	);
};

export default RoomAvatarEditor;
