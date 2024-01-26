import type { IUser, AvatarObject } from '@rocket.chat/core-typings';
import { Box, Button, TextInput, Avatar, IconButton, Label } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';

import { useSingleFileInput } from '../../../hooks/useSingleFileInput';
import { isValidImageFormat } from '../../../lib/utils/isValidImageFormat';
import UserAvatar from '../UserAvatar';
import type { UserAvatarSuggestion } from './UserAvatarSuggestion';
import UserAvatarSuggestions from './UserAvatarSuggestions';
import { readFileAsDataURL } from './readFileAsDataURL';

type UserAvatarEditorProps = {
	currentUsername: IUser['username'];
	username: IUser['username'];
	setAvatarObj: (obj: AvatarObject) => void;
	disabled?: boolean;
	etag: IUser['avatarETag'];
};

function UserAvatarEditor({ currentUsername, username, setAvatarObj, disabled, etag }: UserAvatarEditorProps): ReactElement {
	const t = useTranslation();
	const rotateImages = useSetting('FileUpload_RotateImages');
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState<string>();
	const imageUrlField = useUniqueId();
	const dispatchToastMessage = useToastMessageDispatch();

	const setUploadedPreview = useCallback(
		async (file, avatarObj) => {
			setAvatarObj(avatarObj);
			try {
				const dataURL = await readFileAsDataURL(file);

				if (await isValidImageFormat(dataURL)) {
					setNewAvatarSource(dataURL);
				}
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Avatar_format_invalid') });
			}
		},
		[setAvatarObj, t, dispatchToastMessage],
	);

	const [clickUpload] = useSingleFileInput(setUploadedPreview);

	const handleAddUrl = (): void => {
		setNewAvatarSource(avatarFromUrl);
		setAvatarObj({ avatarUrl: avatarFromUrl });
	};

	const clickReset = (): void => {
		setNewAvatarSource(`/avatar/%40${username}`);
		setAvatarObj('reset');
	};

	const url = newAvatarSource;

	const handleAvatarFromUrlChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setAvatarFromUrl(event.currentTarget.value);
	};

	const handleSelectSuggestion = useCallback(
		(suggestion: UserAvatarSuggestion) => {
			setAvatarObj(suggestion as unknown as AvatarObject);
			setNewAvatarSource(suggestion.blob);
		},
		[setAvatarObj, setNewAvatarSource],
	);

	return (
		<Box display='flex' flexDirection='column' fontScale='p2m' color='default'>
			{t('Profile_picture')}
			<Box display='flex' flexDirection='row' mbs={4}>
				<UserAvatar
					size='x124'
					url={url}
					key={url}
					username={currentUsername || ''}
					etag={etag}
					onError={() => dispatchToastMessage({ type: 'error', message: t('error-invalid-image-url') })}
					style={{
						objectFit: 'contain',
						imageOrientation: rotateImages ? 'from-image' : 'none',
					}}
				/>
				<Box display='flex' flexDirection='column' flexGrow='1' justifyContent='space-between' mis={4}>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Button square disabled={disabled} mi={4} title={t('Accounts_SetDefaultAvatar')} onClick={clickReset}>
							<Avatar url={`/avatar/%40${username}`} />
						</Button>
						<IconButton icon='upload' secondary disabled={disabled} title={t('Upload')} mi={4} onClick={clickUpload} />
						<IconButton
							icon='permalink'
							secondary
							disabled={disabled || !avatarFromUrl}
							title={t('Add_URL')}
							mi={4}
							onClick={handleAddUrl}
							data-qa-id='UserAvatarEditorSetAvatarLink'
						/>
						<UserAvatarSuggestions disabled={disabled} onSelectOne={handleSelectSuggestion} />
					</Box>
					<Label htmlFor={imageUrlField} mis={4}>
						{t('Use_url_for_avatar')}
					</Label>
					<TextInput
						data-qa-id='UserAvatarEditorLink'
						id={imageUrlField}
						flexGrow={0}
						placeholder={t('Use_url_for_avatar')}
						value={avatarFromUrl}
						mis={4}
						onChange={handleAvatarFromUrlChange}
					/>
				</Box>
			</Box>
		</Box>
	);
}

export default UserAvatarEditor;
