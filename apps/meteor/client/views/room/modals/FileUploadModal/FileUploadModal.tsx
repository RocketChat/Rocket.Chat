import {
	Box,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	TextInput,
} from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import fileSize from 'filesize';
import type { ReactElement } from 'react';
import { memo, useCallback, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';

import GenericFormModal from '../../../components/GenericFormModal';
import FilePreview from './FilePreview';
import { fileUploadIsValidContentType } from '../../../../../app/utils/client/restrictions';
import { getMimeTypeFromFileName } from '../../../../../app/utils/lib/mimeTypes';

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
		formState: { errors, isSubmitting },
	} = useForm({
		mode: 'onBlur',
		defaultValues: { name: fileName, description: fileDescription },
	});

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const maxMsgSize = useSetting('Message_MaxAllowedSize', 5000);
	const maxFileSize = useSetting('FileUpload_MaxFileSize', 104857600);

	const isDescriptionValid = (description: string) =>
		description.length >= maxMsgSize
			? t('Cannot_upload_file_character_limit', { count: maxMsgSize })
			: true;

	const validateFileName = useCallback(
		(fieldValue: string) => {
			const type = getMimeTypeFromFileName(fieldValue);
			if (fileUploadIsValidContentType(type)) {
				return true;
			}
			return t('FileUpload_MediaType_NotAccepted__type__', { type });
		},
		[t],
	);

	const submit = ({ name, description }: { name: string; description?: string }): void => {
		if (maxFileSize > -1 && (file.size || 0) > maxFileSize) {
			dispatchToastMessage({
				type: 'error',
				message: t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) }),
			});
			onClose();
			return;
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
	}, [file, invalidContentType, dispatchToastMessage, t, onClose]);

	const formId = useId();
	const fileNameField = useId();
	const fileDescriptionField = useId();
	const autoFocusRef = useAutoFocus();

	const { ref, ...descriptionField } = register('description', {
		validate: (value) => isDescriptionValid(value || ''),
	});

	const descriptionRef = useMergedRefs(ref, autoFocusRef);

	return (
		<GenericFormModal
			id={formId}
			title={t('FileUpload')}
			onClose={onClose}
			onSubmit={handleSubmit(submit)}
			isSubmitting={isSubmitting}
		>
			<Box display='flex' maxHeight='x360' justifyContent='center' mbe={16}>
				<FilePreview file={file} />
			</Box>

			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={fileNameField}>{t('Upload_file_name')}</FieldLabel>
					<FieldRow>
						<TextInput
							id={fileNameField}
							{...register('name', {
								required: t('error-the-field-is-required', { field: t('Upload_file_name') }),
								validate: validateFileName,
							})}
							error={errors.name?.message}
							aria-invalid={Boolean(errors.name)}
							aria-describedby={`${fileNameField}-error`}
						/>
					</FieldRow>
					{errors.name && (
						<FieldError id={`${fileNameField}-error`} role='alert'>
							{errors.name.message}
						</FieldError>
					)}
				</Field>

				{showDescription && (
					<Field>
						<FieldLabel htmlFor={fileDescriptionField}>
							{t('Upload_file_description')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								id={fileDescriptionField}
								ref={descriptionRef}
								{...descriptionField}
								error={errors.description?.message}
								aria-invalid={Boolean(errors.description)}
								aria-describedby={`${fileDescriptionField}-error`}
							/>
						</FieldRow>
						{errors.description && (
							<FieldError id={`${fileDescriptionField}-error`} role='alert'>
								{errors.description.message}
							</FieldError>
						)}
					</Field>
				)}
			</FieldGroup>
		</GenericFormModal>
	);
};

export default memo(FileUploadModal);
