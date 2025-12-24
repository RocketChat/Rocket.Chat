import {
	Modal,
	Box,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	TextInput,
	Button,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import { memo, useId } from 'react';
import { useForm } from 'react-hook-form';

import FilePreview from './FilePreview';

type FileUploadModalProps = {
	onClose: () => void;
	onSubmit: (name: string) => void;
	file: File;
	fileName: string;
};

const FileUploadModal = ({ onClose, file, fileName, onSubmit }: FileUploadModalProps): ReactElement => {
	const t = useTranslation();
	const fileUploadFormId = useId();
	const fileNameField = useId();

	const {
		register,
		handleSubmit,
		formState: { errors, isDirty, isSubmitting },
	} = useForm({ mode: 'onBlur', defaultValues: { name: fileName } });

	return (
		<Modal
			aria-labelledby={`${fileUploadFormId}-title`}
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box is='form' id={fileUploadFormId} onSubmit={handleSubmit(({ name }) => (!isDirty ? onClose() : onSubmit(name)))} {...props} />
			)}
		>
			<Box display='flex' flexDirection='column' height='100%'>
				<ModalHeader>
					<ModalTitle id={`${fileUploadFormId}-title`}>{t('FileUpload')}</ModalTitle>
					<ModalClose onClick={onClose} />
				</ModalHeader>
				<ModalContent>
					<Box display='flex' maxHeight='x360' w='full' justifyContent='center' alignContent='center' mbe={16}>
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
									})}
									error={errors.name?.message}
									aria-invalid={errors.name ? 'true' : 'false'}
									aria-describedby={`${fileNameField}-error`}
									aria-required='true'
								/>
							</FieldRow>
							{errors.name && <FieldError id={`${fileNameField}-error`}>{errors.name.message}</FieldError>}
						</Field>
					</FieldGroup>
				</ModalContent>
				<ModalFooter>
					<ModalFooterControllers>
						<Button secondary onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit' loading={isSubmitting}>
							{t('Update')}
						</Button>
					</ModalFooterControllers>
				</ModalFooter>
			</Box>
		</Modal>
	);
};

export default memo(FileUploadModal);
