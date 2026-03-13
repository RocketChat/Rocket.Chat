import { Field, FieldLabel, FieldRow, TextInput, Box, Margins, Button, ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent, ContextualbarFooter } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import fileSize from 'filesize';
import type { ReactElement, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { validate, createSoundData } from './lib';
import { MAX_CUSTOM_SOUND_SIZE_BYTES } from '../../../../lib/constants';
import { useEndpointUploadMutation } from '../../../hooks/useEndpointUploadMutation';
import { useSingleFileInput } from '../../../hooks/useSingleFileInput';

type AddCustomSoundProps = {
	_goToNew: (_id: string) => () => void;
	close: () => void;
	onChange: () => void;
};

const AddCustomSound = ({ _goToNew, close, onChange, ...props }: AddCustomSoundProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [sound, setSound] = useState<File | undefined>();

	const { mutateAsync: saveAction } = useEndpointUploadMutation('/v1/custom-sounds.create', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Saved_Successfully') });
			onChange();
			close();
		},
	});

	const handleChangeFile = useCallback((soundFile: File) => {
		setSound(soundFile);
	}, []);

	const [clickUpload] = useSingleFileInput(handleChangeFile, 'audio/*', 'audio', MAX_CUSTOM_SOUND_SIZE_BYTES, () => {
		dispatchToastMessage({
			type: 'error',
			message: t('File_exceeds_allowed_size_of_bytes', { size: fileSize(MAX_CUSTOM_SOUND_SIZE_BYTES, { base: 2, standard: 'jedec' }) }),
		});
	});

	const handleSave = useCallback(async () => {
		const soundData = createSoundData(sound, name);
		const validation = validate(soundData, sound) as Array<Parameters<typeof t>[0]>;

		validation.forEach((invalidFieldName) => {
			dispatchToastMessage({ type: 'error', message: t('Required_field', { field: t(invalidFieldName) }) });
			throw new Error(t('Required_field', { field: t(invalidFieldName) }));
		});

		const formData = new FormData();
		if (sound) {
			formData.append('sound', sound);
		}
		formData.append('name', name);
		formData.append('extension', soundData.extension);
		await saveAction(formData);
	}, [sound, name, saveAction, t, dispatchToastMessage]);

	return (
		<>
			<ContextualbarScrollableContent {...props}>
				<Field>
					<FieldLabel>{t('Name')}</FieldLabel>
					<FieldRow>
						<TextInput
							value={name}
							onChange={(e: FormEvent<HTMLInputElement>): void => setName(e.currentTarget.value)}
							placeholder={t('Name')}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel alignSelf='stretch'>{t('Sound_File_mp3')}</FieldLabel>
					<Box display='flex' flexDirection='row' mbs='none' alignItems='center'>
						<Margins inline={4}>
							<IconButton secondary small icon='upload' onClick={clickUpload} />
							{sound?.name || t('None')}
						</Margins>
					</Box>
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

export default AddCustomSound;
