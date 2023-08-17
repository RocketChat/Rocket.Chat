import type { IUser, AvatarObject } from '@rocket.chat/core-typings';
import { Box, Button, TextInput, Margins, Avatar, IconButton } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';

import { useFileInput } from '../../../hooks/useFileInput';
import { isValidImageFormat } from '../../../lib/utils/isValidImageFormat';
import UserAvatar from '../UserAvatar';
import UserAvatarSuggestions from './UserAvatarSuggestions';

const toDataURL = (file: File, callback: (result: FileReader['result']) => void): void => {
	const reader = new FileReader();
	reader.onloadend = function (e): void {
		callback(e?.target?.result || null);
	};
	reader.readAsDataURL(file);
};

type AvatarSuggestion = {
	service: string;
	url: string;
};

type UserAvatarEditorType = {
	currentUsername: IUser['username'];
	username: IUser['username'];
	setAvatarObj: (obj: AvatarObject) => void;
	suggestions: AvatarSuggestion[] | undefined;
	disabled: boolean;
	etag: IUser['avatarETag'];
};

function UserAvatarEditor({ currentUsername, username, setAvatarObj, suggestions, disabled, etag }: UserAvatarEditorType): ReactElement {
	const t = useTranslation();
	const rotateImages = useSetting('FileUpload_RotateImages');
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState<string>();
	const dispatchToastMessage = useToastMessageDispatch();

	const setUploadedPreview = useCallback(
		async (file, avatarObj) => {
			setAvatarObj(avatarObj);
			toDataURL(file, async (dataURL) => {
				if (typeof dataURL === 'string' && (await isValidImageFormat(dataURL))) {
					setNewAvatarSource(dataURL);
					return;
				}

				dispatchToastMessage({ type: 'error', message: t('Avatar_format_invalid') });
			});
		},
		[setAvatarObj, t, dispatchToastMessage],
	);

	const [clickUpload] = useFileInput(setUploadedPreview);

	const clickUrl = (): void => {
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

	return (
		<Box display='flex' flexDirection='column' fontScale='p2m' color='default'>
			{t('Profile_picture')}
			<Box display='flex' flexDirection='row' mbs={4}>
				<UserAvatar
					size='x124'
					url={url}
					username={currentUsername || ''}
					etag={etag}
					style={{
						objectFit: 'contain',
						imageOrientation: rotateImages ? 'from-image' : 'none',
					}}
				/>
				<Box display='flex' flexDirection='column' flexGrow='1' justifyContent='space-between' mis={4}>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Margins inline={4}>
							<Button square mis='none' onClick={clickReset} disabled={disabled} mie={4} title={t('Accounts_SetDefaultAvatar')}>
								<Avatar url={`/avatar/%40${username}`} />
							</Button>
							<IconButton icon='upload' secondary onClick={clickUpload} disabled={disabled} title={t('Upload')} />
							<IconButton
								data-qa-id='UserAvatarEditorSetAvatarLink'
								icon='permalink'
								secondary
								onClick={clickUrl}
								disabled={disabled || !avatarFromUrl}
								title={t('Add_URL')}
							/>
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
					<Margins inlineStart={4}>
						<Box>{t('Use_url_for_avatar')}</Box>
						<TextInput
							data-qa-id='UserAvatarEditorLink'
							flexGrow={0}
							placeholder={t('Use_url_for_avatar')}
							value={avatarFromUrl}
							onChange={handleAvatarFromUrlChange}
						/>
					</Margins>
				</Box>
			</Box>
		</Box>
	);
}

export default UserAvatarEditor;
