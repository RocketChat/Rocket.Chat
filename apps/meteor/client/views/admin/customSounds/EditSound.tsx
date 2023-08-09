import { Box, Button, ButtonGroup, Margins, TextInput, Field, IconButton } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, SyntheticEvent } from 'react';
import React, { useCallback, useState, useMemo, useEffect } from 'react';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import GenericModal from '../../../components/GenericModal';
import { useFileInput } from '../../../hooks/useFileInput';
import { validate, createSoundData } from './lib';

type EditSoundProps = {
	close?: () => void;
	onChange: () => void;
	data: {
		_id: string;
		name: string;
		extension?: string;
	};
};

function EditSound({ close, onChange, data, ...props }: EditSoundProps): ReactElement {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { _id, name: previousName } = data || {};
	const previousSound = useMemo(() => data || {}, [data]);

	const [name, setName] = useState(() => data?.name ?? '');
	const [sound, setSound] = useState(() => data);

	useEffect(() => {
		setName(previousName || '');
		setSound(previousSound || '');
	}, [previousName, previousSound, _id]);

	const deleteCustomSound = useMethod('deleteCustomSound');
	const uploadCustomSound = useMethod('uploadCustomSound');
	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const handleChangeFile = useCallback((soundFile) => {
		setSound(soundFile);
	}, []);

	const hasUnsavedChanges = useMemo(() => previousName !== name || previousSound !== sound, [name, previousName, previousSound, sound]);

	const saveAction = useCallback(
		async (sound) => {
			const soundData = createSoundData(sound, name, { previousName, previousSound, _id, extension: sound.extension });
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

				if (sound && sound !== previousSound) {
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

			validation.forEach((error) =>
				dispatchToastMessage({
					type: 'error',
					message: t('error-the-field-is-required', { field: t(error) }),
				}),
			);
		},
		[_id, dispatchToastMessage, insertOrUpdateSound, name, previousName, previousSound, t, uploadCustomSound],
	);

	const handleSave = useCallback(async () => {
		saveAction(sound);
		onChange();
	}, [saveAction, sound, onChange]);

	const handleDeleteButtonClick = useCallback(() => {
		const handleDelete = async (): Promise<void> => {
			try {
				await deleteCustomSound(_id);
				dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Has_Been_Deleted') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
				close?.();
				onChange();
			}
		};

		const handleCancel = (): void => setModal(null);

		setModal(() => (
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_Sound_Delete_Warning')}
			</GenericModal>
		));
	}, [_id, close, deleteCustomSound, dispatchToastMessage, onChange, setModal, t]);

	const [clickUpload] = useFileInput(handleChangeFile, 'audio/mp3');

	return (
		<>
			<ContextualbarScrollableContent {...props}>
				<Field>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput
							value={name}
							onChange={(e: SyntheticEvent<HTMLInputElement>): void => setName(e.currentTarget.value)}
							placeholder={t('Name')}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label alignSelf='stretch'>{t('Sound_File_mp3')}</Field.Label>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Margins inline={4}>
							<IconButton icon='upload' secondary onClick={clickUpload} />
							{sound?.name || 'none'}
						</Margins>
					</Box>
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<ButtonGroup mbs={8} stretch>
					<Button icon='trash' danger onClick={handleDeleteButtonClick}>
						{t('Delete')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
}

export default EditSound;
