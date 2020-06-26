import React, { useState, useCallback } from 'react';
import { Box, Button, Icon, TextInput, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import UserAvatar from './UserAvatar';

function UserAvatarSuggestions({ suggestions, setAvatarObj, setNewAvatarSource, ...props }) {
	const handleClick = useCallback((suggestion) => () => {
		setAvatarObj(suggestion);
		setNewAvatarSource(suggestion.blob);
	}, [setAvatarObj, setNewAvatarSource]);

	return <Margins inline='x4' {...props}>
		{Object.values(suggestions).map((suggestion) => <Button square onClick={handleClick(suggestion)}>
			<UserAvatar key={suggestion.service} title={suggestion.service} size='x36' url={suggestion.blob} mie='x4'/>
		</Button>)}
	</Margins>;
}

export function UserAvatarEditor({ username, setAvatarObj, suggestions }) {
	const t = useTranslation();
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState();

	const setUploadedPreview = useCallback(async (file, avatarObj) => {
		setAvatarObj(avatarObj);
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
						{suggestions && <UserAvatarSuggestions suggestions={suggestions} setAvatarObj={setAvatarObj} setNewAvatarSource={setNewAvatarSource}/>}
					</Margins>
				</Box>
				<Box>{t('Use_url_for_avatar')}</Box>
				<TextInput flexGrow={0} placeholder={t('Use_url_for_avatar')} value={avatarFromUrl} onChange={handleAvatarFromUrlChange}/>
			</Box>
		</Box>
	</Box>;
}

export default UserAvatarEditor;
