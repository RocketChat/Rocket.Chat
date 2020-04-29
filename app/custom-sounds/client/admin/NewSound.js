import React, { useState } from 'react';
import { Field, TextInput, Box, InputBox, Margins, Button } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import s from 'underscore.string';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Page } from '../../../../client/components/basic/Page';
import { useMethod } from '../../../../client/contexts/ServerContext';

export function NewSound({ roles, ...props }) {
	const t = useTranslation();

	const uploadCustomSound = useMethod('uploadCustomSound');
	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const dispatchToastMessage = useToastMessageDispatch();

	const [newData, setNewData] = useState({});

	const fileSourceInputId = useUniqueId();

	const createSoundData = (name) => {
		const soundData = {};
		soundData.name = s.trim(name);
		soundData.newFile = true;
		return soundData;
	};

	// const validate = (soundData) => {
	// 	const errors = [];
	// 	if (!soundData.name) {
	// 		errors.push('Name');
	// 	}

	// 	if (!soundData._id) {
	// 		if (!this.soundFile) {
	// 			errors.push('Sound_File_mp3');
	// 		}
	// 	}

	// 	for (const error of errors) {
	// 		toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
	// 	}

	// 	if (this.soundFile) {
	// 		if (!/audio\/mp3/.test(this.soundFile.type) && !/audio\/mpeg/.test(this.soundFile.type) && !/audio\/x-mpeg/.test(this.soundFile.type)) {
	// 			errors.push('FileType');
	// 			toastr.error(TAPi18n.__('error-invalid-file-type'));
	// 		}
	// 	}

	// 	return errors.length === 0;
	// };


	const saveAction = async (newData) => {
		const soundData = createSoundData(newData.name);
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
	};

	const handleSave = async () => {
		if (Object.keys(newData).length) {
			await saveAction(newData);
		}
	};

	// Meteor.call('uploadCustomSound', reader.result, soundFileFile.type, soundData, (uploadError/* , data*/) => {
	// 	if (uploadError != null) {
	// 		handleError(uploadError);
	// 		console.log(uploadError);
	// 	}
	// },
	// );
	// delete soundFileFile;

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

	return <Page.ContentScrolable pb='x24' mi='neg-x24' is='form' { ...props }>
		<Margins blockEnd='x16'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={handleChange('name')}/>
				</Field.Row>
			</Field>

			<Field>
				<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>{t('Sound_File_mp3')}</Field.Label>
				<Field.Row>
					<InputBox type='file' id={fileSourceInputId} onChange={handleChangeFile('soundFile')} />
				</Field.Row>
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
	</Page.ContentScrolable>;
}
