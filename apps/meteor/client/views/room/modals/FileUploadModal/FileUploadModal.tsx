import { Modal, Box, Field, FieldGroup, TextInput, Button } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, memo, useState, ChangeEvent, FormEventHandler, useEffect } from 'react';

import FilePreview from './FilePreview';

type FileUploadModalProps = {
	onClose: () => void;
	onSubmit: (name: string, description?: string) => void;
	file: File;
	fileName: string;
	fileDescription?: string;
	invalidContentType: boolean;
};

const FileUploadModal = ({
	onClose,
	file,
	fileName,
	fileDescription,
	onSubmit,
	invalidContentType,
}: FileUploadModalProps): ReactElement => {
	const [name, setName] = useState<string>(fileName);
	const [description, setDescription] = useState<string>(fileDescription || '');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const ref = useAutoFocus<HTMLInputElement>();

	const handleName = (e: ChangeEvent<HTMLInputElement>): void => {
		setName(e.currentTarget.value);
	};

	const handleDescription = (e: ChangeEvent<HTMLInputElement>): void => {
		setDescription(e.currentTarget.value);
	};

	const handleSubmit: FormEventHandler<HTMLFormElement> = (e): void => {
		e.preventDefault();
		if (!name) {
			return dispatchToastMessage({
				type: 'error',
				message: t('error-the-field-is-required', { field: t('Name') }),
			});
		}
		onSubmit(name, description);
	};

	useEffect(() => {
		if (invalidContentType) {
			dispatchToastMessage({
				type: 'error',
				message: t('FileUpload_MediaType_NotAccepted__type__', { type: file.type }),
			});
			onClose();
			return;
		}

		if (file.size === 0) {
			dispatchToastMessage({
				type: 'error',
				message: t('FileUpload_File_Empty'),
			});
			onClose();
		}
	}, [file, dispatchToastMessage, invalidContentType, t, onClose]);

	return (
		<Modal>
			<Box is='form' display='flex' flexDirection='column' height='100%' onSubmit={handleSubmit}>
				<Modal.Header>
					<Modal.Title>{t('FileUpload')}</Modal.Title>
					<Modal.Close onClick={onClose} />
				</Modal.Header>
				<Modal.Content overflow='hidden'>
					<Box display='flex' maxHeight='x360' w='full' justifyContent='center' alignContent='center' mbe='x16'>
						<FilePreview file={file} />
					</Box>
					<FieldGroup>
						<Field>
							<Field.Label>{t('Upload_file_name')}</Field.Label>
							<Field.Row>
								<TextInput value={name} onChange={handleName} />
							</Field.Row>
							{!name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>}
						</Field>
						<Field>
							<Field.Label>{t('Upload_file_description')}</Field.Label>
							<Field.Row>
								<TextInput value={description} onChange={handleDescription} placeholder={t('Description')} ref={ref} />
							</Field.Row>
						</Field>
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<Modal.FooterControllers>
						<Button secondary onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit' disabled={!name}>
							{t('Send')}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(FileUploadModal);
