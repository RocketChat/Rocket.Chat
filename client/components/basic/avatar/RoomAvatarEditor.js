import React, { useState } from 'react';
import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import RoomAvatar from './RoomAvatar';
import { useFileInput } from '../../../hooks/useFileInput';
import { useTranslation } from '../../../contexts/TranslationContext';
import { getAvatarURL } from '../../../../app/utils/lib/getAvatarURL';

const reader = new FileReader();

const RoomAvatarEditor = ({ room, onChangeAvatar = () => {}, ...props }) => {
	const t = useTranslation();
	const [newAvatar, setNewAvatar] = useState();

	const handleChangeAvatar = useMutableCallback((file) => {
		setNewAvatar(URL.createObjectURL(file));
		reader.readAsDataURL(file);
		reader.onloadend = () => {
			setNewAvatar(reader.result);
			onChangeAvatar(reader.result);
		};
	});

	const clickUpload = useFileInput(handleChangeAvatar);
	const clickReset = useMutableCallback(() => {
		onChangeAvatar(null);
		setNewAvatar(null);
	});

	return <Box borderRadius='x2' maxWidth='x332' w='full' position='relative' {...props}>
		<RoomAvatar { ...newAvatar !== undefined && { url: newAvatar === null ? getAvatarURL({ username: `@${ room.name }` }) : newAvatar } } room={room} size='332px' maxWidth='100%'/>
		<Box className={[css`bottom: 0; right: 0;`]} position='absolute' m='x12'>
			<ButtonGroup>
				<Button small title={t('Upload_user_avatar')} onClick={clickUpload}>
					<Icon name='upload' size='x16' />
					{t('Upload')}
				</Button>

				<Button primary small danger title={t('Accounts_SetDefaultAvatar')} onClick={clickReset}>
					<Icon name='trash' size='x16' />
				</Button>
			</ButtonGroup>
		</Box>
	</Box>;
};

export default RoomAvatarEditor;
