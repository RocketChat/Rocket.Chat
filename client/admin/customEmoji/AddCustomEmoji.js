import React, { useState } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, InputBox } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import s from 'underscore.string';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

export function AddCustomEmojis({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	// const [name, setName] = useState('');
	const [aliases, setAliases] = useState('');

	const uploadCustomEmoji = useMethod('uploadCustomEmoji');

	const saveEmoji = useMethod('insertOrUpdateUserStatus');

	const [newData, setNewData] = useState({});

	const fileSourceInputId = useUniqueId();

	const createEmojiData = (name) => {
		const soundEmoji = {};
		soundEmoji.name = s.trim(name);
		soundEmoji.newFile = true;
		return soundEmoji;
	};

	const saveAction = async (newData) => {
		const emojiData = createEmojiData(newData.name);
		let emojiId;

		try {
			emojiId = await saveEmoji(emojiData);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}

		emojiData._id = emojiId;
		emojiData.random = Math.round(Math.random() * 1000);

		if (emojiId) {
			dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

			const reader = new FileReader();
			reader.readAsBinaryString(newData.soundFile);
			reader.onloadend = () => {
				console.log(reader.result, newData.soundFile.type, emojiData);

				try {
					uploadCustomEmoji(reader.result, newData.soundFile.type, emojiData);
					dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};
		}
	};

	const handleSave = async () => {
		if (Object.keys(newData).length) {
			await saveAction(newData);
		}
	};

	// const handleSave = useCallback(async () => {
	// 	try {
	// 		const result = await saveEmoji({
	// 			name,
	// 			aliases,
	// 		});
	// 		dispatchToastMessage({ type: 'success', message: t('Custom_Emoji_Added_Successfully') });
	// 		goToNew(result)();
	// 		onChange();
	// 	} catch (error) {
	// 		dispatchToastMessage({ type: 'error', message: 'Custom_Emoji_Error_Name_Or_Alias_Already_In_Use' });
	// 	}
	// }, [name, aliases]);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

	const handleChangeFile = (field, getFile = (e) => {
		let { files } = e.target;
		let soundFile;
		if (e.target.files == null || files.length === 0) {
			if (e.dataTransfer.files != null) {
				files = e.dataTransfer.files;
			} else {
				files = [];
			}
		}
		for (const file in files) {
			if (files.hasOwnProperty(file)) {
				soundFile = files[file];
			}
		}

		return soundFile;
	}) => (e) => {
		setNewData({ ...newData, [field]: getFile(e) });
	};

	const {
		name = '',
	} = newData;


	return <Box display='flex' flexDirection='column' fontScale='p1' color='default' mbs='x20' {...props}>
		<Margins block='x4'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={handleChange('name') } />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Aliases')}</Field.Label>
				<Field.Row>
					<TextInput value={aliases} onChange={(e) => setAliases(e.currentTarget.value)} placeholder={t('Aliases')}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>{t('Emoji')}</Field.Label>
				<Field.Row>
					<InputBox type='file' id={fileSourceInputId} onChange={handleChangeFile('emojiFile')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={name === ''}>{t('Save')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</Margins>
	</Box>;
}
