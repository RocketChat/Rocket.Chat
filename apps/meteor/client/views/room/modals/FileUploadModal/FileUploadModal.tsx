import { Modal, Box, Field, FieldGroup, FieldLabel, FieldRow, FieldError, TextInput, Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import fileSize from 'filesize';
import type { ReactElement, ComponentProps } from 'react';
import { useRef, memo, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';

import FilePreview from './FilePreview';
import { fileUploadIsValidContentType } from '../../../../../app/utils/client/restrictions';
import { getMimeTypeFromFileName } from '../../../../../app/utils/lib/mimeTypes';

export type FileUploadModalProps = {
	onClose: () => void;
	onSubmit: (name: string, altText?: string) => void;
	file: File;
	fileName: string;
	fileAltText?: string;
};

const FileUploadModal = ({ onClose, file, fileName, fileAltText = '', onSubmit }: FileUploadModalProps) => {
	const { t } = useTranslation();
	const fileUploadFormId = useId();
	const isImage = file.type.startsWith('image/');

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty, isSubmitting },
	} = useForm({ mode: 'onBlur', defaultValues: { name: fileName, altText: fileAltText } });

		onSubmit(name, description);
	};
	const hasRendered = useRef(false);
	useEffect(() => {
		if (hasRendered.current) {
            return;
        }
        hasRendered.current = true;
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

	const fileUploadFormId = useId();
	const fileNameField = useId();
	const fileDescriptionField = useId();

	return (
		<Modal
			aria-labelledby={`${fileUploadFormId}-title`}
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box is='form' id={fileUploadFormId} onSubmit={handleSubmit(({ name, altText }) => onSubmit(name, altText?.trim()))} {...props} />
			)}
		>
			<Box display='flex' flexDirection='column' height='100%'>
				<ModalHeader>
					<ModalTitle id={`${fileUploadFormId}-title`}>{t('FileUpload')}</ModalTitle>
					<ModalClose tabIndex={-1} onClick={onClose} />
				</ModalHeader>
				<ModalContent>
					<Box display='flex' maxHeight='x360' width='full' justifyContent='center' alignContent='center' marginBlockEnd={16}>
						<FilePreview file={file} altText={fileAltText} />
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
									<Controller name='altText' control={control} render={({ field }) => <TextAreaInput {...field} />} />
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
