import { Box, Button, ButtonGroup, Margins, TextInput, Field, FieldLabel, FieldRow, IconButton } from '@rocket.chat/fuselage';
import { GenericModal, ContextualbarScrollableContent, ContextualbarFooter } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import fileSize from 'filesize';
import type { SyntheticEvent } from 'react';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { validate } from './lib';
import { CUSTOM_SOUND_ALLOWED_MIME_TYPES, MAX_CUSTOM_SOUND_SIZE_BYTES } from '../../../../lib/constants';
import { useEndpointUploadMutation } from '../../../hooks/useEndpointUploadMutation';
import { useSingleFileInput } from '../../../hooks/useSingleFileInput';

type EditSoundProps = {
	close: () => void;
	onChange: () => void;
	data: {
		_id: string;
		name: string;
		extension: string;
	};
};

function EditSound({ close, onChange, data, ...props }: EditSoundProps) {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { _id, name: previousName } = data || {};

	const [name, setName] = useState(() => data?.name ?? '');
	const [file, setFile] = useState<File | undefined>();

	useEffect(() => {
		setName(previousName || '');
		setFile(undefined);
	}, [_id, previousName]);

	const deleteCustomSoundEndpoint = useEndpoint('POST', '/v1/custom-sounds.delete');

	const { mutate: saveAction } = useEndpointUploadMutation('/v1/custom-sounds.update', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Saved_Successfully') });
			onChange();
			close();
		},
	});

	const handleChangeFile = useCallback((soundFile: File) => {
		setFile(soundFile);
	}, []);

	const hasUnsavedChanges = useMemo(() => previousName !== name || !!file, [name, previousName, file]);

	const handleSave = useCallback(async () => {
		const trimmedName = name.trim();
		const validation = validate({ _id, name: trimmedName }, file);
		if (validation.length > 0) {
			const firstInvalidField = validation[0];
			dispatchToastMessage({
				type: 'error',
				message: t('Required_field', { field: t(firstInvalidField) }),
			});
			return;
		}

		const formData = new FormData();
		formData.append('_id', _id);
		formData.append('name', trimmedName);
		if (file) {
			formData.append('sound', file);
		}
		saveAction(formData);
	}, [_id, dispatchToastMessage, name, saveAction, file, t]);

	const handleDeleteButtonClick = useCallback(() => {
		const handleDelete = async (): Promise<void> => {
			try {
				await deleteCustomSoundEndpoint({ _id });
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

		setModal(
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_Sound_Delete_Warning')}
			</GenericModal>,
		);
	}, [_id, close, deleteCustomSoundEndpoint, dispatchToastMessage, onChange, setModal, t]);

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

	return (
		<>
			<ContextualbarScrollableContent {...props}>
				<Field>
					<FieldLabel>{t('Name')}</FieldLabel>
					<FieldRow>
						<TextInput
							value={name}
							onChange={(e: SyntheticEvent<HTMLInputElement>): void => setName(e.currentTarget.value)}
							placeholder={t('Name')}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel alignSelf='stretch'>{t('Sound File')}</FieldLabel>
					<Box display='flex' flexDirection='row' mbs='none' alignItems='center'>
						<Margins inline={4}>
							<IconButton secondary small icon='upload' onClick={clickUpload} />
							{file?.name || (data?.name && data?.extension && `${data.name}.${data.extension}`) || t('None')}
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
