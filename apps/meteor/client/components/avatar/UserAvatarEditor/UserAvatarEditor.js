import { Box, Button, TextInput, Margins, Avatar, IconButton } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback } from 'react';

import { useFileInput } from '../../../hooks/useFileInput';
import UserAvatar from '../UserAvatar';
import UserAvatarSuggestions from './UserAvatarSuggestions';

function UserAvatarEditor({ currentUsername, username, setAvatarObj, suggestions, disabled, etag }) {
	const t = useTranslation();
	const rotateImages = useSetting('FileUpload_RotateImages');
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState();
	const [urlEmpty, setUrlEmpty] = useState(true);
	const dispatchToastMessage = useToastMessageDispatch();
	const toDataURL = (file, callback) => {
		const reader = new FileReader();
		reader.onload = function (e) {
			callback(e.target.result);
		};
		reader.readAsDataURL(file);
	};

	const setUploadedPreview = useCallback(
		async (file, avatarObj) => {
			if (file.type.startsWith('image/')) {
				setAvatarObj(avatarObj);
				toDataURL(file, (dataurl) => {
					setNewAvatarSource(dataurl);
				});
			} else dispatchToastMessage({ type: 'error', message: t('Avatar_format_invalid') });
		},
		[setAvatarObj, t, dispatchToastMessage],
	);

	const [clickUpload] = useFileInput(setUploadedPreview);

	const clickUrl = () => {
		if (avatarFromUrl === '') {
			return;
		}
		setNewAvatarSource(avatarFromUrl);
		setAvatarObj({ avatarUrl: avatarFromUrl });
	};
	const clickReset = () => {
		setNewAvatarSource(`/avatar/%40${username}`);
		setAvatarObj('reset');
	};

	const url = newAvatarSource;

	const handleAvatarFromUrlChange = (event) => {
		event.currentTarget.value !== '' ? setUrlEmpty(false) : setUrlEmpty(true);
		setAvatarFromUrl(event.currentTarget.value);
	};

	return (
		<Box display='flex' flexDirection='column' fontScale='p2m'>
			{t('Profile_picture')}
			<Box display='flex' flexDirection='row' mbs='x4'>
				<UserAvatar
					size='x124'
					url={url}
					username={currentUsername}
					etag={etag}
					style={{
						objectFit: 'contain',
						imageOrientation: rotateImages ? 'from-image' : 'none',
					}}
					mie='x4'
				/>
				<Box display='flex' flexDirection='column' flexGrow='1' justifyContent='space-between' mis='x4'>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Margins inline='x4'>
							<Button square mis='none' onClick={clickReset} disabled={disabled} mie='x4' title={t('Accounts_SetDefaultAvatar')}>
								<Avatar url={`/avatar/%40${username}`} />
							</Button>
							<IconButton icon='upload' secondary onClick={clickUpload} disabled={disabled} title={t('Upload')} />
							<IconButton icon='permalink' secondary onClick={clickUrl} disabled={disabled || urlEmpty} title={t('Add URL')} />
							{suggestions && (
								<UserAvatarSuggestions
									suggestions={suggestions}
									setAvatarObj={setAvatarObj}
									setNewAvatarSource={setNewAvatarSource}
									disabled={disabled}
								/>
							)}
						</Margins>
					</Box>
					<Margins inlineStart='x4'>
						<Box>{t('Use_url_for_avatar')}</Box>
						<TextInput flexGrow={0} placeholder={t('Use_url_for_avatar')} value={avatarFromUrl} onChange={handleAvatarFromUrlChange} />
					</Margins>
				</Box>
			</Box>
		</Box>
	);
}

export default UserAvatarEditor;
