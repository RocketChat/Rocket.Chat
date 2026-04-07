import type { IUser, AvatarObject } from '@rocket.chat/core-typings';
import { Box, Button, Avatar, IconButton } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, FieldError, TextInput } from '@rocket.chat/fuselage-forms';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent } from 'react';
import { useId, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserAvatarSuggestion } from './UserAvatarSuggestion';
import UserAvatarSuggestions from './UserAvatarSuggestions';
import { readFileAsDataURL } from './readFileAsDataURL';
import { useSingleFileInput } from '../../../hooks/useSingleFileInput';
import { isSafeAvatarUrl } from '../../../lib/utils/isSafeAvatarUrl';
import { isValidImageFormat } from '../../../lib/utils/isValidImageFormat';

type UserAvatarEditorProps = {
	currentUsername: IUser['username'];
	username: IUser['username'];
	setAvatarObj: (obj: AvatarObject) => void;
	disabled?: boolean;
	etag: IUser['avatarETag'];
	name: IUser['name'];
};

function UserAvatarEditor({ currentUsername, username, setAvatarObj, name, disabled, etag }: UserAvatarEditorProps): ReactElement {
	const { t } = useTranslation();
	const useFullNameForDefaultAvatar = useSetting('UI_Use_Name_Avatar');
	const rotateImages = useSetting('FileUpload_RotateImages');
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState<string>();
	const imageUrlField = useId();
	const dispatchToastMessage = useToastMessageDispatch();
	const [avatarUrlError, setAvatarUrlError] = useState<string | undefined>(undefined);

	const setUploadedPreview = useCallback(
		async (file: File, avatarObj: AvatarObject) => {
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
		if (isSafeAvatarUrl(avatarFromUrl)) {
			setNewAvatarSource(avatarFromUrl);
			setAvatarObj({ avatarUrl: avatarFromUrl });
			setAvatarUrlError(undefined);
		} else {
			setAvatarUrlError(t('error-invalid-image-url'));
		}
	};

	const clickReset = (): void => {
		setNewAvatarSource(`/avatar/%40${useFullNameForDefaultAvatar ? name : username}`);
		setAvatarObj('reset');
	};

	const url = newAvatarSource;

	const handleAvatarFromUrlChange = (event: ChangeEvent<HTMLInputElement>): void => {
		if (avatarUrlError) {
			setAvatarUrlError(undefined);
		}
		const { value } = event.currentTarget;
		setAvatarFromUrl(value);
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
					alt={t('__username__profile_picture', { username: currentUsername || 'user' })}
					username={currentUsername || ''}
					etag={etag}
					style={{
						imageOrientation: rotateImages ? 'from-image' : 'none',
						objectFit: 'contain',
					}}
					onError={() => setAvatarUrlError(t('error-invalid-image-url'))}
				/>
				<Box display='flex' flexDirection='column' flexGrow='1' mis={4}>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Button square disabled={disabled} mi={4} title={t('Accounts_SetDefaultAvatar')} onClick={clickReset}>
							<Avatar url={`/avatar/%40${useFullNameForDefaultAvatar ? name : username}`} />
						</Button>
						<IconButton icon='upload' secondary disabled={disabled} title={t('Upload')} mi={4} onClick={clickUpload} />
						<IconButton
							icon='permalink'
							secondary
							disabled={disabled || !avatarFromUrl || !!avatarUrlError}
							title={t('Add_URL')}
							mi={4}
							onClick={handleAddUrl}
						/>
						<UserAvatarSuggestions disabled={disabled} onSelectOne={handleSelectSuggestion} />
					</Box>
					<Field mis={4} mbs={16}>
						<FieldLabel htmlFor={imageUrlField}>{t('Use_url_for_avatar')}</FieldLabel>
						<FieldRow>
							<TextInput
								id={imageUrlField}
								placeholder={t('Use_url_for_avatar')}
								value={avatarFromUrl}
								onChange={handleAvatarFromUrlChange}
								error={avatarUrlError}
								aria-invalid={!!avatarUrlError}
								aria-describedby={avatarUrlError ? `${imageUrlField}-error` : undefined}
							/>
						</FieldRow>
						{avatarUrlError && (
							<FieldError aria-live='assertive' id={`${imageUrlField}-error`}>
								{avatarUrlError}
							</FieldError>
						)}
					</Field>
				</Box>
			</Box>
		</Box>
	);
}

export default UserAvatarEditor;
