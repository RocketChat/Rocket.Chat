import React, { useState, useCallback } from 'react';
import { Box, Button, Icon, TextInput, Margins, Avatar } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useFileInput } from '../../hooks/useFileInput';
import UserAvatar from './UserAvatar';

function UserAvatarSuggestions({ suggestions, setAvatarObj, setNewAvatarSource, disabled, ...props }) {
	const handleClick = useCallback((suggestion) => () => {
		setAvatarObj(suggestion);
		setNewAvatarSource(suggestion.blob);
	}, [setAvatarObj, setNewAvatarSource]);

	return <Margins inline='x4' {...props}>
		{Object.values(suggestions)
			.map((suggestion) =>
				<Button
					key={suggestion.service}
					disabled={disabled}
					square
					onClick={handleClick(suggestion)}
				>
					<Box mie='x4'>
						<Avatar title={suggestion.service} url={suggestion.blob} />
					</Box>
				</Button>)}
	</Margins>;
}

export function UserAvatarEditor({ username, setAvatarObj, suggestions, disabled, etag }) {
	const t = useTranslation();
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState();

	const setUploadedPreview = useCallback(async (file, avatarObj) => {
		setAvatarObj(avatarObj);
		setNewAvatarSource(URL.createObjectURL(file));
	}, [setAvatarObj]);

	const [clickUpload] = useFileInput(setUploadedPreview);

	const clickUrl = () => {
		setNewAvatarSource(avatarFromUrl);
		setAvatarObj({ avatarUrl: avatarFromUrl });
	};
	const clickReset = () => {
		setNewAvatarSource(`/avatar/%40${ username }`);
		setAvatarObj('reset');
	};

	const url = newAvatarSource;

	const handleAvatarFromUrlChange = (event) => {
		setAvatarFromUrl(event.currentTarget.value);
	};

	return <Box display='flex' flexDirection='column' fontScale='p2'>
		{t('Profile_picture')}
		<Box display='flex' flexDirection='row' mbs='x4'>
			<UserAvatar size='x124' url={url} username={username} etag={etag} style={{ objectFit: 'contain' }} mie='x4'/>
			<Box display='flex' flexDirection='column' flexGrow='1' justifyContent='space-between' mis='x4'>
				<Box display='flex' flexDirection='row' mbs='none'>
					<Margins inline='x4'>
						<Button square mis='none' onClick={clickReset} disabled={disabled} mie='x4'>
							<Avatar url={`/avatar/%40${ username }`}/>
						</Button>
						<Button square onClick={clickUpload} disabled={disabled}><Icon name='upload' size='x20'/></Button>
						<Button square mie='none' onClick={clickUrl} disabled={disabled}><Icon name='permalink' size='x20'/></Button>
						{suggestions && <UserAvatarSuggestions suggestions={suggestions} setAvatarObj={setAvatarObj} setNewAvatarSource={setNewAvatarSource} disabled={disabled}/>}
					</Margins>
				</Box>
				<Box>{t('Use_url_for_avatar')}</Box>
				<TextInput flexGrow={0} placeholder={t('Use_url_for_avatar')} value={avatarFromUrl} onChange={handleAvatarFromUrlChange}/>
			</Box>
		</Box>
	</Box>;
}

export default UserAvatarEditor;
