import type { ICustomSound, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, FieldLabel, FieldRow, IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import type { ReactElement, SyntheticEvent } from 'react';
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import GenericModal from '../../../components/GenericModal';
import { useSingleFileInput } from '../../../hooks/useSingleFileInput';
import { validate, createSoundData } from './lib';

type EditSoundProps = {
	data: Serialized<ICustomSound>;
	onClose?: () => void;
	onChange: () => void;
};

function EditSound({ data, onChange, onClose }: EditSoundProps): ReactElement {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { _id } = data;
	const previousName = data.name;
	const previousExtension = data.extension;
	const previousSound = useMemo(() => data || {}, [data]);

	const [name, setName] = useState(previousName);
	const [sound, setSound] = useState<File>();

	useEffect(() => {
		setName(previousName);
		setSound(undefined);
	}, [previousName, previousSound, _id]);

	const deleteCustomSound = useMethod('deleteCustomSound');
	const uploadCustomSound = useMethod('uploadCustomSound');
	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const handleChangeFile = useEffectEvent((soundFile: File) => {
		setSound(soundFile);
	});

	const hasUnsavedChanges = name !== previousName || sound !== undefined;

	const handleSave = useEffectEvent(async () => {
		const soundData = createSoundData(sound, name, { previousName, previousSound, _id, extension: previousExtension });
		const validation = validate(soundData, sound);
		if (validation.length === 0) {
			let soundId: string;
			try {
				soundId = await insertOrUpdateSound(soundData);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				return;
			}

			soundData._id = soundId;
			soundData.random = Math.round(Math.random() * 1000);

			if (sound && !Object.is(sound, previousSound)) {
				dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

				const reader = new FileReader();
				reader.readAsBinaryString(sound);
				reader.onloadend = (): void => {
					try {
						uploadCustomSound(reader.result as string, sound.type, { ...soundData, _id: soundId });
						return dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
				};
			}
		}

		validation.forEach((invalidFieldName) =>
			dispatchToastMessage({
				type: 'error',
				message: t('Required_field', { field: t(invalidFieldName) }),
			}),
		);
		onChange();
	});

	const handleDeleteButtonClick = useCallback(() => {
		const handleDelete = async (): Promise<void> => {
			try {
				await deleteCustomSound(_id);
				dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Has_Been_Deleted') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
				onClose?.();
				onChange();
			}
		};

		const handleCancel = (): void => setModal(null);

		setModal(
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_Sound_Delete_Warning')}
			</GenericModal>,
		);
	}, [_id, onClose, deleteCustomSound, dispatchToastMessage, onChange, setModal, t]);

	const [clickUpload] = useSingleFileInput(handleChangeFile, 'audio/mp3'); // FIXME: mixing `File` and `ICustomSoundFile` is a mistake

	return (
		<>
			<ContextualbarScrollableContent>
				<Field>
					<FieldLabel>{t('Name')}</FieldLabel>
					<FieldRow>
						<TextInput
							value={name}
							onChange={(e: SyntheticEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
							placeholder={t('Name')}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel alignSelf='stretch'>{t('Sound_File_mp3')}</FieldLabel>
					<Box display='flex' flexDirection='row' mbs='none' alignItems='center'>
						<Margins inline={4}>
							<IconButton secondary small icon='upload' onClick={clickUpload} />
							{sound?.name || 'none'}
						</Margins>
					</Box>
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<Box mbs={8}>
					<ButtonGroup stretch>
						<Button icon='trash' danger onClick={handleDeleteButtonClick}>
							{t('Delete')}
						</Button>
					</ButtonGroup>
				</Box>
			</ContextualbarFooter>
		</>
	);
}

export default EditSound;
