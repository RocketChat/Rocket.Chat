import React, { useState } from 'react';
import { Box, Button, Icon, Margins, TextInput, Field } from '@rocket.chat/fuselage';
import s from 'underscore.string';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useFileInput } from '../../hooks/useFileInput';
import { Page } from '../../components/basic/Page';
// import { emoji } from '/app/emoji/client';

export function AddCustomEmojis({ roles, ...props }) {
	const t = useTranslation();

	const uploadEmojiCustom = useMethod('uploadEmojiCustom');
	const insertOrUpdateEmoji = useMethod('insertOrUpdateEmoji');

	const dispatchToastMessage = useToastMessageDispatch();

	const [newData, setNewData] = useState({});

	const createEmojiData = (name, aliases) => {
		const emojiData = {};
		emojiData.name = s.trim(name);
		emojiData.aliases = s.trim(aliases);
		emojiData.newFile = true;
		return emojiData;
	};

	const validate = (emojiData, emojiFile) => {
		const errors = [];
		if (!emojiData.name) {
			errors.push('Name');
		}

		if (!emojiData.aliases) {
			errors.push('Aliases');
		}

		if (!emojiFile) {
			errors.push('Emoji');
		}

		errors.forEach((error) => dispatchToastMessage({ type: 'error', message: t('error-the-field-is-required', t(error)) }));

		if (emojiFile) {
			if (!/image\/jpg/.test(emojiFile.type) && !/image\/png/.test(emojiFile.type)) {
				errors.push('FileType');
				dispatchToastMessage({ type: 'error', message: t('error-invalid-file-type') });
			}
		}

		return errors.length === 0;
	};


	const saveAction = async (newData) => {
		const emojiData = createEmojiData(newData.name, newData.aliases);
		if (validate(emojiData, newData.emojiFile)) {
			let emojiId;
			try {
				emojiId = await insertOrUpdateEmoji(emojiData);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			emojiData._id = emojiId;
			emojiData.random = Math.round(Math.random() * 1000);

			if (emojiId) {
				dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

				const reader = new FileReader();
				reader.readAsBinaryString(newData.emojiFile);
				reader.onloadend = () => {
					console.log(reader.result, newData.emojiFile.type, emojiData);

					try {
						uploadEmojiCustom(reader.result, newData.emojiFile.type, emojiData);
						dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
				};
			}
		}
	};

	const handleSave = async () => {
		if (Object.keys(newData).length) {
			await saveAction(newData);
			setNewData({});
		}
	};

	const handleChangeFile = (emojiFile) => {
		setNewData({ ...newData, emojiFile });
	};
	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

	const clickUpload = useFileInput(handleChangeFile, 'image/jpg');
	const {
		name = '',
		aliases = '',
	} = newData;

	return <Page.ScrollableContent display='flex' flexDirection='column' fontScale='p1' color='default' mbs='x20' {...props}>
		<Margins block='x4'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={handleChange('name')}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Aliases')}</Field.Label>
				<Field.Row>
					<TextInput value={aliases} onChange={handleChange('aliases')}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label alignSelf='stretch'>{t('Emoji')}</Field.Label>
				<Box display='flex' flexDirection='row' mbs='none'>
					<Margins inline='x4'>
						<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
					</Margins>
				</Box>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd='x4'>
							<Button flexGrow={1} onClick={() => setNewData({})}>{t('Cancel')}</Button>
							<Button mie='none' flexGrow={1} onClick={handleSave}>{t('Save')}</Button>
						</Margins>
					</Box>
				</Field.Row>
			</Field>
		</Margins>
	</Page.ScrollableContent>;
}
