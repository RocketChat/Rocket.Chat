import React, { useState, useCallback } from 'react';
import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import RoomAvatar from './RoomAvatar';
import { useFileInput } from '../../../hooks/useFileInput';
import { useTranslation } from '../../../contexts/TranslationContext';
import BaseAvatar from './BaseAvatar';

const reader = new FileReader();

const RoomAvatarEditor = ({ room, onChangeAvatar, ...props }) => {
	const t = useTranslation();
	const [newAvatar, setNewAvatar] = useState();

	const handleChangeAvatar = useCallback((file) => {
		setNewAvatar(URL.createObjectURL(file));
		reader.readAsDataURL(file);
		reader.onloadend = () => {
			onChangeAvatar(reader.result);
		};
	}, [onChangeAvatar]);

	const clickUpload = useFileInput(handleChangeAvatar);
	const clickReset = () => setNewAvatar('reset');

	return <Box borderRadius='x2' size='x332' position='relative' {...props}>
		{!newAvatar && <RoomAvatar room={room} size='full'/>}
		{newAvatar && <BaseAvatar url={newAvatar} size='full'/>}

		<Box className={[css`bottom: 0; right: 0;`]} position='absolute' m='x12'>
			<ButtonGroup>
				<Button title={t('Upload_user_avatar')} onClick={clickUpload}>
					<Icon name='upload' size='x16' />
					{t('Upload')}
				</Button>

				<Button primary danger title={t('Accounts_SetDefaultAvatar')} onClick={clickReset}>
					<Icon name='trash' size='x16' />
				</Button>
			</ButtonGroup>
		</Box>
	</Box>;
};

export default RoomAvatarEditor;
