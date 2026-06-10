import {
	Modal,
	Box,
	Button,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import {
	TextInput,
	TextAreaInput,
	Field,
	FieldError,
	FieldRow,
	FieldLabel,
	FieldGroup,
	FieldDescription,
} from '@rocket.chat/fuselage-forms';
import type { ComponentProps } from 'react';
import { memo, useCallback, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FilePreview from './FilePreview';
import { fileUploadIsValidContentType } from '../../../../../app/utils/client/restrictions';
import { getMimeTypeFromFileName } from '../../../../../app/utils/lib/mimeTypes';

type FileUploadModalProps = {
	onClose: () => void;
	onSubmit: (name: string, description?: string) => void;
	file: File;
	fileName: string;
	fileDescription?: string;
};

const FileUploadModal = ({ onClose, file, fileName, fileDescription = '', onSubmit }: FileUploadModalProps) => {
	const { t } = useTranslation();
	const fileUploadFormId = useId();
	const isImage = file.type.startsWith('image/');

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty, isSubmitting },
	} = useForm({ mode: 'onBlur', defaultValues: { name: fileName, description: fileDescription } });

	const validateFileName = useCallback(
		(fieldValue: string) => {
			const type = getMimeTypeFromFileName(fieldValue);
			if (fileUploadIsValidContentType(type)) {
				return undefined;
			}

			return t('FileUpload_MediaType_NotAccepted__type__', { type });
		},
		[t],
	);

	return (
		<Modal
			aria-labelledby={`${fileUploadFormId}-title`}
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box
					is='form'
					id={fileUploadFormId}
					onSubmit={handleSubmit(({ name, description }) => onSubmit(name, description?.trim() || undefined))}
					{...props}
				/>
			)}
		>
			<Box display='flex' flexDirection='column' height='100%'>
				<ModalHeader>
					<ModalTitle id={`${fileUploadFormId}-title`}>{t('FileUpload')}</ModalTitle>
					<ModalClose tabIndex={-1} onClick={onClose} />
				</ModalHeader>
				<ModalContent>
					<Box display='flex' maxHeight='x360' w='full' justifyContent='center' alignContent='center' mbe={16}>
						<FilePreview file={file} description={fileDescription} />
					</Box>
					<FieldGroup>
						<Field>
							<FieldLabel>{t('Upload_file_name')}</FieldLabel>
							<FieldRow>
								<Controller
									name='name'
									control={control}
									rules={{
										required: t('error-the-field-is-required', { field: t('Upload_file_name') }),
										validate: validateFileName,
									}}
									render={({ field }) => <TextInput {...field} error={errors.name?.message} aria-required='true' />}
								/>
							</FieldRow>
							{errors.name && <FieldError>{errors.name.message}</FieldError>}
						</Field>
						{isImage && (
							<Field>
								<FieldLabel>{t('Alternative_text')}</FieldLabel>
								<FieldDescription>{t('Alt_text_description')}</FieldDescription>
								<FieldRow>
									<Controller name='description' control={control} render={({ field }) => <TextAreaInput {...field} />} />
								</FieldRow>
							</Field>
						)}
					</FieldGroup>
				</ModalContent>
				<ModalFooter>
					<ModalFooterControllers>
						<Button secondary onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit' disabled={!isDirty} loading={isSubmitting}>
							{t('Update')}
						</Button>
					</ModalFooterControllers>
				</ModalFooter>
			</Box>
		</Modal>
	);
};

export default memo(FileUploadModal);
