import React, { useState, useCallback } from 'react';
import { Box, Button, Icon, TextInput, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import UserAvatar from './UserAvatar';

export function UserAvatarEditor({ username, setAvatarObj }) {
	const t = useTranslation();
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState();

	const setUploadedPreview = useCallback(async (file, formData) => {
		setAvatarObj(formData);
		setNewAvatarSource(URL.createObjectURL(file));
	}, [setAvatarObj]);

	const clickUpload = useFileInput(setUploadedPreview);

	const clickUrl = () => {
		setNewAvatarSource(avatarFromUrl);
		setAvatarObj({ avatarUrl: avatarFromUrl });
	};
	const clickReset = () => {
		setNewAvatarSource(`/avatar/%40${ username }`);
		setAvatarObj('reset');
	};

	const url = newAvatarSource || undefined;

	const handleAvatarFromUrlChange = (event) => {
		setAvatarFromUrl(event.currentTarget.value);
	};

	return <Box display='flex' flexDirection='column' fontScale='p2'>
		{t('Profile_picture')}
		<Box display='flex' flexDirection='row' mbs='x4'>
			<UserAvatar size='x120' url={url} username={username} style={{ objectFit: 'contain' }} mie='x4'/>
			<Box display='flex' flexDirection='column' flexGrow='1' justifyContent='space-between' mis='x4'>
				<Box display='flex' flexDirection='row' mbs='none'>
					<Margins inline='x4'>
						<Button square mis='none' onClick={clickReset}><UserAvatar size='x36' username={`%40${ username }`} mie='x4'/></Button>
						<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
						<Button square mie='none' onClick={clickUrl}><Icon name='permalink' size='x20'/></Button>
					</Margins>
				</Box>
				<Box>{t('Use_url_for_avatar')}</Box>
				<TextInput flexGrow={0} placehloder={t('Use_url_for_avatar')} value={avatarFromUrl} onChange={handleAvatarFromUrlChange}/>
			</Box>
		</Box>
	</Box>;
}

export default UserAvatarEditor;
