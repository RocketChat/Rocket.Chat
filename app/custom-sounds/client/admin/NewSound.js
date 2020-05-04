import React, { useState } from 'react';
import { Field, TextInput, Box, Icon, Margins, Button } from '@rocket.chat/fuselage';
import s from 'underscore.string';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useFileInput } from '../../../../client/hooks/useFileInput';
import Page from '../../../../client/components/basic/Page';

export function NewSound({ roles, ...props }) {
	const t = useTranslation();

	const uploadCustomSound = useMethod('uploadCustomSound');
	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const dispatchToastMessage = useToastMessageDispatch();

	const [newData, setNewData] = useState({});

	const createSoundData = (name) => {
		const soundData = {};
		soundData.name = s.trim(name);
		soundData.newFile = true;
		return soundData;
	};

	const validate = (soundData, soundFile) => {
		const errors = [];
		if (!soundData.name) {
			errors.push('Name');
		}


		if (!soundFile) {
			errors.push('Sound_File_mp3');
		}

		errors.forEach((error) => dispatchToastMessage({ type: 'error', message: t('error-the-field-is-required', t(error)) }));

		if (soundFile) {
			if (!/audio\/mp3/.test(soundFile.type) && !/audio\/mpeg/.test(soundFile.type) && !/audio\/x-mpeg/.test(soundFile.type)) {
				errors.push('FileType');
				dispatchToastMessage({ type: 'error', message: t('error-invalid-file-type') });
			}
		}

		return errors.length === 0;
	};


	const saveAction = async (newData) => {
		const soundData = createSoundData(newData.name);
		if (validate(soundData, newData.soundFile)) {
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
				reader.readAsBinaryString(newData.soundFile);
				reader.onloadend = () => {
					console.log(reader.result, newData.soundFile.type, soundData);

					try {
						uploadCustomSound(reader.result, newData.soundFile.type, soundData);
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

	const handleChangeFile = (soundFile) => {
		setNewData({ ...newData, soundFile });
	};
	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

	const clickUpload = useFileInput(handleChangeFile, 'audio/mp3');
	const {
		name = '',
	} = newData;

	return <Page.ScrollableContent pi='x24' pb='x24' mi='neg-x24' is='form' { ...props }>
		<Margins blockEnd='x16'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={handleChange('name')}/>
				</Field.Row>
			</Field>

			<Field>
				<Field.Label alignSelf='stretch'>{t('Sound_File_mp3')}</Field.Label>
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
