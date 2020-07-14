import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useFileInput } from '../../hooks/useFileInput';
import { useEndpointUpload } from '../../hooks/useEndpointUpload';
import VerticalBar from '../../components/basic/VerticalBar';

export function AddCustomEmoji({ close, onChange, ...props }) {
	const t = useTranslation();

	const [name, setName] = useState('');
	const [aliases, setAliases] = useState('');
	const [emojiFile, setEmojiFile] = useState();
	const [newEmojiPreview, setNewEmojiPreview] = useState('');

	const setEmojiPreview = useCallback(async (file) => {
		setEmojiFile(file);
		setNewEmojiPreview(URL.createObjectURL(file));
	}, [setEmojiFile]);

	const saveAction = useEndpointUpload('emoji-custom.create', {}, t('Custom_Emoji_Added_Successfully'));

	const handleSave = useCallback(async () => {
		const formData = new FormData();
		formData.append('emoji', emojiFile);
		formData.append('name', name);
		formData.append('aliases', aliases);
		const result = await saveAction(formData);

		if (result.success) {
			onChange();
			close();
		}
	}, [emojiFile, name, aliases, saveAction, onChange, close]);

	const clickUpload = useFileInput(setEmojiPreview, 'emoji');

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Aliases')}</Field.Label>
			<Field.Row>
				<TextInput value={aliases} onChange={(e) => setAliases(e.currentTarget.value)} placeholder={t('Aliases')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label alignSelf='stretch' display='flex' justifyContent='space-between' alignItems='center'>
				{t('Custom_Emoji')}
				<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
			</Field.Label>
			{ newEmojiPreview && <Box display='flex' flexDirection='row' mi='neg-x4' justifyContent='center'>
				<Margins inline='x4'>
					<Box is='img' style={{ objectFit: 'contain' }} w='x120' h='x120' src={newEmojiPreview}/>
				</Margins>
			</Box> }
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary danger><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
