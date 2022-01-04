import { Field, TextInput, Box, Icon, Margins, Button, ButtonGroup } from '@rocket.chat/fuselage';
import React, { useState, useCallback } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import { validate, createSoundData } from './lib';

function AddCustomSound({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [sound, setSound] = useState();

	const uploadCustomSound = useMethod('uploadCustomSound');

	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const handleChangeFile = useCallback((soundFile) => {
		setSound(soundFile);
	}, []);

	const [clickUpload] = useFileInput(handleChangeFile, 'audio/mp3');

	const saveAction = useCallback(
		async (name, soundFile) => {
			const soundData = createSoundData(soundFile, name);
			const validation = validate(soundData, soundFile);
			if (validation.length === 0) {
				let soundId;
				try {
					soundId = await insertOrUpdateSound(soundData);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}

				soundData._id = soundId;
				soundData.random = Math.round(Math.random() * 1000);

				if (soundId) {
					dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

					const reader = new FileReader();
					reader.readAsBinaryString(soundFile);
					reader.onloadend = () => {
						try {
							uploadCustomSound(reader.result, soundFile.type, soundData);
							dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
						} catch (error) {
							dispatchToastMessage({ type: 'error', message: error });
						}
					};
				}
				return soundId;
			}
			validation.forEach((error) => {
				throw new Error({
					type: 'error',
					message: t('error-the-field-is-required', { field: t(error) }),
				});
			});
		},
		[dispatchToastMessage, insertOrUpdateSound, t, uploadCustomSound],
	);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(name, sound);
			dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Saved_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, name, onChange, saveAction, sound, t]);

	return (
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label alignSelf='stretch'>{t('Sound_File_mp3')}</Field.Label>
				<Box display='flex' flexDirection='row' mbs='none'>
					<Margins inline='x4'>
						<Button square onClick={clickUpload}>
							<Icon name='upload' size='x20' />
						</Button>
						{(sound && sound.name) || 'none'}
					</Margins>
				</Box>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button mie='x4' onClick={close}>
							{t('Cancel')}
						</Button>
						<Button primary onClick={handleSave} disabled={name === ''}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
}

export default AddCustomSound;
