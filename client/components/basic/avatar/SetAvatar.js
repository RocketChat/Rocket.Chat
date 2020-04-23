import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Icon, TextInput, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { UserAvatar } from './Avatar';

export function useFileInput(onSetFile) {
	const [openInput, setOpenInput] = useState();
	useEffect(() => {
		const fileInput = document.createElement('input');
		fileInput.setAttribute('type', 'file');
		fileInput.setAttribute('style', 'display: none');
		document.body.appendChild(fileInput);

		const handleFiles = function() { onSetFile(this.files[0]); };
		fileInput.addEventListener('change', handleFiles, false);
		setOpenInput(() => () => fileInput.click());
		return () => {
			fileInput.parentNode.removeChild(fileInput);
		};
	}, [onSetFile]);
	return openInput;
}

export function SetAvatar({ username, setAvatarObj }) {
	const t = useTranslation();
	const [avatarFromUrl, setAvatarFromUrl] = useState();
	const [newAvatarSource, setNewAvatarSource] = useState();

	const setUploadedPreview = useCallback((file) => {
		setAvatarObj({ image: file });
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

	return <Box display='flex' flexDirection='column' textStyle='p2'>
		{t('Profile_picture')}
		<Box display='flex' flexDirection='row' mbs='x4'>
			<UserAvatar size='x120' url={url} username={username} style={{ objectFit: 'contain' }} mie='x4'/>
			<Box display='flex' flexDirection='column' flexGrow='1'>
				<Margins block ='x4' inline='x4'>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Margins inline='x4'>
							<Button square large mis='none' onClick={clickReset}><UserAvatar size='x36' username={`%40${ username }`} mie='x4'/></Button>
							<Button square large onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
							<Button square large mie='none' onClick={clickUrl}><Icon name='permalink' size='x20'/></Button>
						</Margins>
					</Box>
					<Box>{t('Use_url_for_avatar')}</Box>
					<TextInput placehloder={t('Use_url_for_avatar')} value={avatarFromUrl} onChange={(e) => { setAvatarFromUrl(e.currentTarget.value); }}/>
				</Margins>
			</Box>
		</Box>
	</Box>;
}
