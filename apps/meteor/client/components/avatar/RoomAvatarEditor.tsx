import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getAvatarURL } from '../../../app/utils/client/getAvatarURL';
import { useSingleFileInput } from '../../hooks/useSingleFileInput';
import { isValidImageFormat } from '../../lib/utils/isValidImageFormat';

type RoomAvatarEditorProps = {
	room: Pick<IRoom, RoomAdminFieldsType>;
	disabled?: boolean;
	roomAvatar?: string;
	onChangeAvatar: (url: string | null) => void;
};

const RoomAvatarEditor = ({ disabled = false, room, roomAvatar, onChangeAvatar }: RoomAvatarEditorProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleChangeAvatar = useEffectEvent(async (file: File) => {
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

	const [clickUpload, reset] = useSingleFileInput(handleChangeAvatar);
	const clickReset = useEffectEvent(() => {
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
						disabled={!roomAvatar || isRoomFederated(room) || disabled}
						onClick={clickReset}
					/>
				</ButtonGroup>
			</Box>
		</Box>
	);
};

export default RoomAvatarEditor;
