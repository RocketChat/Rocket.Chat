import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, ReactElement, ChangeEvent } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import { useFileInput } from '../../../hooks/useFileInput';

type AddCustomEmojiProps = {
	close: () => void;
	onChange: () => void;
};

const AddCustomEmoji = ({ close, onChange, ...props }: AddCustomEmojiProps): ReactElement => {
	const t = useTranslation();
	const [name, setName] = useState('');
	const [aliases, setAliases] = useState('');
	const [emojiFile, setEmojiFile] = useState<Blob>();
	const [newEmojiPreview, setNewEmojiPreview] = useState('');
	const [errors, setErrors] = useState({ name: false, emoji: false, aliases: false });

	const setEmojiPreview = useCallback(
		async (file) => {
			setEmojiFile(file);
			setNewEmojiPreview(URL.createObjectURL(file));
			setErrors((prevState) => ({ ...prevState, emoji: false }));
		},
		[setEmojiFile],
	);

	const saveAction = useEndpointUpload('emoji-custom.create', {}, t('Custom_Emoji_Added_Successfully'));

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
		const result = (await saveAction(formData)) as { success: boolean };

		if (result.success) {
			onChange();
			close();
		}
	}, [emojiFile, name, aliases, saveAction, onChange, close]);

	const [clickUpload] = useFileInput(setEmojiPreview, 'emoji');

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
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={handleChangeName} placeholder={t('Name')} />
				</Field.Row>
				{errors.name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>}
			</Field>
			<Field>
				<Field.Label>{t('Aliases')}</Field.Label>
				<Field.Row>
					<TextInput value={aliases} onChange={handleChangeAliases} placeholder={t('Aliases')} />
				</Field.Row>
				{errors.aliases && <Field.Error>{t('Custom_Emoji_Error_Same_Name_And_Alias')}</Field.Error>}
			</Field>
			<Field>
				<Field.Label alignSelf='stretch' display='flex' justifyContent='space-between' alignItems='center'>
					{t('Custom_Emoji')}
					<Button square onClick={clickUpload}>
						<Icon name='upload' size='x20' />
					</Button>
				</Field.Label>
				{errors.emoji && <Field.Error>{t('error-the-field-is-required', { field: t('Custom_Emoji') })}</Field.Error>}
				{newEmojiPreview && (
					<Box display='flex' flexDirection='row' mi='neg-x4' justifyContent='center'>
						<Margins inline='x4'>
							<Box is='img' style={{ objectFit: 'contain' }} w='x120' h='x120' src={newEmojiPreview} />
						</Margins>
					</Box>
				)}
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
};

export default AddCustomEmoji;
