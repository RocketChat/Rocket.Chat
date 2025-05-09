import { Field, FieldLabel, FieldRow, TextInput, Box, Margins, Button, ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import type { ReactElement, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { validate, createSoundData } from './lib';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import { useSingleFileInput } from '../../../hooks/useSingleFileInput';

type AddCustomSoundProps = {
	goToNew: (_id: string) => () => void;
	close: () => void;
	onChange: () => void;
};

const AddCustomSound = ({ goToNew, close, onChange, ...props }: AddCustomSoundProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [sound, setSound] = useState<{ name: string }>();

	const uploadCustomSound = useMethod('uploadCustomSound');
	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const handleChangeFile = useCallback((soundFile: File) => {
		setSound(soundFile);
	}, []);

	const [clickUpload] = useSingleFileInput(handleChangeFile, 'audio/mp3');

	const saveAction = useCallback(
		// FIXME
		async (name: string, soundFile: any) => {
			const soundData = createSoundData(soundFile, name);
			const validation = validate(soundData, soundFile) as Array<Parameters<typeof t>[0]>;

			validation.forEach((invalidFieldName) => {
				throw new Error(t('Required_field', { field: t(invalidFieldName) }));
			});

			try {
				const soundId = await insertOrUpdateSound(soundData);

				if (!soundId) {
					return undefined;
				}

				dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

				const reader = new FileReader();
				reader.readAsBinaryString(soundFile);
				reader.onloadend = (): void => {
					try {
						uploadCustomSound(reader.result as string, soundFile.type, {
							...soundData,
							_id: soundId,
							random: Math.round(Math.random() * 1000),
						});
						dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
					} catch (error) {
						(typeof error === 'string' || error instanceof Error) && dispatchToastMessage({ type: 'error', message: error });
					}
				};
				return soundId;
			} catch (error) {
				(typeof error === 'string' || error instanceof Error) && dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[dispatchToastMessage, insertOrUpdateSound, t, uploadCustomSound],
	);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(name, sound);
			if (result) {
				dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Saved_Successfully') });
			}
			result && goToNew(result);
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, name, onChange, saveAction, sound, t]);

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
