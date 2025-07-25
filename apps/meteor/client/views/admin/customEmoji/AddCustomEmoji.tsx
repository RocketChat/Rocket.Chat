import { Box, Button, ButtonGroup, Margins, TextInput, Field, FieldLabel, FieldRow, FieldError, IconButton } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import { useEndpointUploadMutation } from '../../../hooks/useEndpointUploadMutation';
import { useSingleFileInput } from '../../../hooks/useSingleFileInput';

type AddCustomEmojiProps = {
	close: () => void;
	onChange: () => void;
};

const AddCustomEmoji = ({ close, onChange, ...props }: AddCustomEmojiProps): ReactElement => {
	const { t } = useTranslation();
	const [name, setName] = useState('');
	const [aliases, setAliases] = useState('');
	const [emojiFile, setEmojiFile] = useState<Blob>();
	const [newEmojiPreview, setNewEmojiPreview] = useState('');
	const [errors, setErrors] = useState({ name: false, emoji: false, aliases: false });

	const setEmojiPreview = useCallback(
		async (file: Blob) => {
			setEmojiFile(file);
			setNewEmojiPreview(URL.createObjectURL(file));
			setErrors((prevState) => ({ ...prevState, emoji: false }));
		},
		[setEmojiFile],
	);

	const dispatchToastMessage = useToastMessageDispatch();

	const { mutateAsync: saveAction } = useEndpointUploadMutation('/v1/emoji-custom.create', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Custom_Emoji_Added_Successfully') });
			onChange();
			close();
		},
	});

	const handleSave = useCallback(async () => {
		if (!name) {
			return setErrors((prevState) => ({ ...prevState, name: true }));
		}

		if (name === aliases) {
			return setErrors((prevState) => ({ ...prevState, aliases: true }));
		}

		if (!emojiFile) {
			return setErrors((prevState) => ({ ...prevState, emoji: true }));
		}

		const formData = new FormData();
		formData.append('emoji', emojiFile);
		formData.append('name', name);
		formData.append('aliases', aliases);
		await saveAction(formData);
	}, [emojiFile, name, aliases, saveAction]);

	const [clickUpload] = useSingleFileInput(setEmojiPreview, 'emoji');

	const handleChangeName = (e: ChangeEvent<HTMLInputElement>): void => {
		if (e.currentTarget.value !== '') {
			setErrors((prevState) => ({ ...prevState, name: false }));
		}

		return setName(e.currentTarget.value);
	};

	const handleChangeAliases = (e: ChangeEvent<HTMLInputElement>): void => {
		if (e.currentTarget.value !== name) {
			setErrors((prevState) => ({ ...prevState, aliases: false }));
		}

		return setAliases(e.currentTarget.value);
	};

	return (
		<>
			<ContextualbarScrollableContent {...props}>
				<Field>
					<FieldLabel>{t('Name')}</FieldLabel>
					<FieldRow>
						<TextInput value={name} onChange={handleChangeName} placeholder={t('Name')} />
					</FieldRow>
					{errors.name && <FieldError>{t('Required_field', { field: t('Name') })}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('Aliases')}</FieldLabel>
					<FieldRow>
						<TextInput value={aliases} onChange={handleChangeAliases} placeholder={t('Aliases')} />
					</FieldRow>
					{errors.aliases && <FieldError>{t('Custom_Emoji_Error_Same_Name_And_Alias')}</FieldError>}
				</Field>
				<Field>
					<FieldLabel alignSelf='stretch' display='flex' justifyContent='space-between' alignItems='center'>
						{t('Custom_Emoji')}
						<IconButton secondary small icon='upload' onClick={clickUpload} />
					</FieldLabel>
					{errors.emoji && <FieldError>{t('Required_field', { field: t('Custom_Emoji') })}</FieldError>}
					{newEmojiPreview && (
						<Box display='flex' flexDirection='row' mi='neg-x4' justifyContent='center'>
							<Margins inline={4}>
								<Box is='img' style={{ objectFit: 'contain' }} w='x120' h='x120' src={newEmojiPreview} />
							</Margins>
						</Box>
					)}
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AddCustomEmoji;
