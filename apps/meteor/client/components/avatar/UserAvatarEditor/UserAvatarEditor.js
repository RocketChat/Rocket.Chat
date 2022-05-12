import { Box, Button, Icon, TextInput, Margins, Avatar } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useSetting, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback } from 'react';

import { useFileInput } from '../../../hooks/useFileInput';
import UserAvatar from '../UserAvatar';
import UserAvatarSuggestions from './UserAvatarSuggestions';

function UserAvatarEditor({ currentUsername, username, setAvatarObj, suggestions, disabled, etag }) {
	const t = useTranslation();
	const user = useUser();
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
	let today = new Date();
	const dd = String(today.getDate()).padStart(2, '0');
	const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	const yyyy = today.getFullYear();

	today = mm + '/' + dd + '/' + yyyy;

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
				<Box
					style={{ marginLeft: '20px !important' }}
					display='flex'
					flexDirection='column'
					flexGrow='1'
					justifyContent='space-between'
					mis='x4'
				>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Margins inline='x4'>
							<Button square mis='none' onClick={clickReset} disabled={disabled} mie='x4' title={t('Accounts_SetDefaultAvatar')}>
								<Avatar url={`/avatar/%40${username}`} />
							</Button>
							<Button square onClick={clickUpload} disabled={disabled} title={t('Upload')}>
								<Icon name='upload' size='x20' />
							</Button>
							<Button square mie='none' onClick={clickUrl} disabled={disabled || urlEmpty} title={t('Add URL')}>
								<Icon name='permalink' size='x20' />
							</Button>
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
						<Box fontWeight='bold' fontSize='20px' style={{ margin: '8px 0' }}>
							{user.name}
							<img src='images/icons/icon-male.png' alt='gender icon' />
						</Box>
						<Box style={{ marginBottom: '8px' }}>@{user.username} </Box>
						<Box style={{ marginBottom: '8px' }}>Joined: {today}</Box>
						<Box fontWeight='bold' style={{ marginBottom: '10px' }}>
							Last Active: {user._updatedAt.toString().slice(15, 24)}
						</Box>
					</Margins>
				</Box>
			</Box>
		</Box>
	);
}

export default UserAvatarEditor;
