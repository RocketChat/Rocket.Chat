import { Box, Button, ButtonGroup, Margins, TextInput, Field, Icon, IconButton } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, useMemo, useEffect, ReactElement, SyntheticEvent } from 'react';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
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
				let soundId;
				try {
					soundId = await insertOrUpdateSound(soundData);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}

				soundData._id = soundId;
				soundData.random = Math.round(Math.random() * 1000);

				if (sound && sound !== previousSound) {
					dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

					const reader = new FileReader();
					reader.readAsBinaryString(sound);
					reader.onloadend = (): void => {
						try {
							uploadCustomSound(reader.result, sound.type, soundData);
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
		const handleClose = (): void => {
			setModal(null);
			close?.();
			onChange();
		};

		const handleDelete = async (): Promise<void> => {
			try {
				await deleteCustomSound(_id);
				setModal(() => (
					<GenericModal variant='success' onCancel={handleClose} onClose={handleClose} onConfirm={handleClose}>
						{t('Custom_Sound_Has_Been_Deleted')}
					</GenericModal>
				));
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				onChange();
			}
		};

		const handleCancel = (): void => {
			setModal(null);
		};

		setModal(() => (
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_Sound_Delete_Warning')}
			</GenericModal>
		));
	}, [_id, close, deleteCustomSound, dispatchToastMessage, onChange, setModal, t]);

	const [clickUpload] = useFileInput(handleChangeFile, 'audio/mp3');

	return (
		<VerticalBar.ScrollableContent {...props}>
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
					<Margins inline='x4'>
						<IconButton icon='upload' secondary onClick={clickUpload} />
						{sound?.name || 'none'}
					</Margins>
				</Box>
			</Field>

			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button danger onClick={handleDeleteButtonClick}>
							<Icon name='trash' mie='x4' />
							{t('Delete')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
}

export default EditSound;
