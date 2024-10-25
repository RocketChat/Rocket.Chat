import { Modal, Box, Field, FieldGroup, FieldLabel, FieldRow, FieldError, TextInput, Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import fileSize from 'filesize';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import FilePreview from './FilePreview';

type FileUploadModalProps = {
	onClose: () => void;
	onSubmit: (name: string, description?: string) => void;
	file: File;
	fileName: string;
	fileDescription?: string;
	invalidContentType: boolean;
	showDescription?: boolean;
};

const FileUploadModal = ({
	onClose,
	file,
	fileName,
	fileDescription,
	onSubmit,
	invalidContentType,
	showDescription = true,
}: FileUploadModalProps): ReactElement => {
	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm({ mode: 'onChange', defaultValues: { name: fileName, description: fileDescription } });

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const maxFileSize = useSetting('FileUpload_MaxFileSize') as number;
	const maxMsgSize = useSetting('Message_MaxAllowedSize') as number;

	const isDescriptionValid = (description: string) =>
		description.length >= maxMsgSize ? t('Cannot_upload_file_character_limit', { count: maxMsgSize }) : true;

	const submit = ({ name, description }: { name: string; description?: string }): void => {
		// -1 maxFileSize means there is no limit
		if (maxFileSize > -1 && (file.size || 0) > maxFileSize) {
			onClose();
			return dispatchToastMessage({
				type: 'error',
				message: t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) }),
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
		<Modal wrapperFunction={(props: ComponentProps<typeof Box>) => <Box is='form' onSubmit={handleSubmit(submit)} {...props} />}>
			<Box display='flex' flexDirection='column' height='100%'>
				<Modal.Header>
					<Modal.Title>{t('FileUpload')}</Modal.Title>
					<Modal.Close onClick={onClose} />
				</Modal.Header>
				<Modal.Content>
					<Box display='flex' maxHeight='x360' w='full' justifyContent='center' alignContent='center' mbe={16}>
						<FilePreview file={file} />
					</Box>
					<FieldGroup>
						<Field>
							<FieldLabel>{t('Upload_file_name')}</FieldLabel>
							<FieldRow>
								<TextInput
									{...register('name', {
										required: t('error-the-field-is-required', { field: t('Name') }),
									})}
								/>
							</FieldRow>
							<FieldError>{errors.name?.message}</FieldError>
						</Field>
						{showDescription && (
							<Field>
								<FieldLabel>{t('Upload_file_description')}</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('description', {
											validate: (value) => isDescriptionValid(value || ''),
										})}
										aria-label={t('Upload_file_description')}
									/>
								</FieldRow>
								<FieldError>{errors.description?.message}</FieldError>
							</Field>
						)}
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<Modal.FooterControllers>
						<Button secondary onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit' disabled={!isValid}>
							{t('Send')}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(FileUploadModal);
