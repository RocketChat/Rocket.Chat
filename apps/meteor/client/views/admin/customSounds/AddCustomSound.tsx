import { Field, FieldLabel, FieldRow, TextInput, Box, Margins, Button, ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent, ContextualbarFooter } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, type UploadResult } from '@rocket.chat/ui-contexts';
import fileSize from 'filesize';
import type { ReactElement, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { validate } from './lib';
import { CUSTOM_SOUND_ALLOWED_MIME_TYPES, MAX_CUSTOM_SOUND_SIZE_BYTES } from '../../../../lib/constants';
import { useEndpointUploadMutation } from '../../../hooks/useEndpointUploadMutation';
import { useSingleFileInput } from '../../../hooks/useSingleFileInput';

type AddCustomSoundProps = {
	goToNew: (_id: string) => () => void;
	close: () => void;
	onChange: () => void;
};

type CustomSoundCreateResult = UploadResult & {
	sound: {
		_id: string;
	};
};

const AddCustomSound = ({ goToNew, close, onChange, ...props }: AddCustomSoundProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [sound, setSound] = useState<File | undefined>();

	const { mutate: saveAction } = useEndpointUploadMutation<'/v1/custom-sounds.create', CustomSoundCreateResult>(
		'/v1/custom-sounds.create',
		{
			onSuccess: ({ sound }) => {
				dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Saved_Successfully') });
				onChange();
				goToNew(sound._id)();
			},
		},
	);

	const handleChangeFile = useCallback((soundFile: File) => {
		setSound(soundFile);
	}, []);

	const [clickUpload] = useSingleFileInput(
		handleChangeFile,
		CUSTOM_SOUND_ALLOWED_MIME_TYPES.join(','),
		'audio',
		MAX_CUSTOM_SOUND_SIZE_BYTES,
		() => {
			dispatchToastMessage({
				type: 'error',
				message: t('File_exceeds_allowed_size_of_bytes', { size: fileSize(MAX_CUSTOM_SOUND_SIZE_BYTES, { base: 2, standard: 'jedec' }) }),
			});
		},
	);

	const handleSave = useCallback(async () => {
		const trimmedName = name.trim();
		const validation = validate({ name: trimmedName }, sound) as Array<Parameters<typeof t>[0]>;
		if (validation.length > 0) {
			const firstInvalidField = validation[0];
			dispatchToastMessage({
				type: 'error',
				message: t('Required_field', { field: t(firstInvalidField) }),
			});
			return;
		}

		const formData = new FormData();
		if (sound) {
			formData.append('sound', sound);
		}
		formData.append('name', trimmedName);
		saveAction(formData);
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
					<FieldLabel alignSelf='stretch'>{t('Sound File')}</FieldLabel>
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
