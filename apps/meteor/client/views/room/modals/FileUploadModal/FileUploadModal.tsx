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
	Callout,
	CheckBox,
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
import { memo, useCallback, useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FilePreview from './FilePreview';
import { fileUploadIsValidContentType } from '../../../../lib/utils/restrictions';
import { getMimeTypeFromFileName } from '../../../../../app/utils/lib/mimeTypes';
import { compressImage } from '../../../../lib/utils/compressImage';
import { formatBytes } from '../../../../lib/utils/formatBytes';

export type FileUploadModalProps = {
	onClose: () => void;
	onSubmit: (name: string, altText?: string, file?: File) => void;
	file: File;
	fileName: string;
	fileAltText?: string;
};

const LARGE_MEDIA_THRESHOLD = 10 * 1024 * 1024; // 10MB

const FileUploadModal = ({ onClose, file: initialFile, fileName, fileAltText = '', onSubmit }: FileUploadModalProps) => {
	const { t } = useTranslation();
	const fileUploadFormId = useId();

	const [currentFile, setCurrentFile] = useState<File>(initialFile);
	const [isCompressed, setIsCompressed] = useState(false);
	const [isCompressing, setIsCompressing] = useState(false);

	const isImage = currentFile.type.startsWith('image/');
	const isLargeMedia = initialFile.size > LARGE_MEDIA_THRESHOLD;

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty, isSubmitting },
	} = useForm({ mode: 'onBlur', defaultValues: { name: fileName, altText: fileAltText } });

	const handleImageCompressionToggle = async (shouldCompress: boolean) => {
		if (shouldCompress) {
			setIsCompressing(true);
			const compressed = await compressImage(initialFile);
			setCurrentFile(compressed);
			setIsCompressed(compressed.size < initialFile.size);
			setIsCompressing(false);
		} else {
			setCurrentFile(initialFile);
			setIsCompressed(false);
		}
	};

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
					onSubmit={handleSubmit(({ name, altText }) => onSubmit(name, altText?.trim(), currentFile))}
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
					{isLargeMedia && (
						<Box marginBlockEnd={16}>
							<Callout type='warning' title={t('Warning')}>
								{t('FileUpload_Large_Media_Warning', { size: formatBytes(initialFile.size, 2) })}
							</Callout>
						</Box>
					)}
					<Box display='flex' maxHeight='x360' width='full' justifyContent='center' alignContent='center' marginBlockEnd={16}>
						<FilePreview file={currentFile} altText={fileAltText} />
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
							<>
								<Field>
									<FieldLabel>{t('Alternative_text')}</FieldLabel>
									<FieldDescription>{t('Alt_text_description')}</FieldDescription>
									<FieldRow>
										<Controller name='altText' control={control} render={({ field }) => <TextAreaInput {...field} />} />
									</FieldRow>
								</Field>
								<Field>
									<FieldRow>
										<CheckBox
											checked={isCompressed}
											disabled={isCompressing}
											onChange={(e) => handleImageCompressionToggle((e.target as HTMLInputElement).checked)}
										/>
										<FieldLabel>{t('FileUpload_Compress_Image')}</FieldLabel>
									</FieldRow>
									{isCompressed && (
										<FieldDescription>
											{t('FileUpload_Image_Compressed_Info', {
												originalSize: formatBytes(initialFile.size, 2),
												compressedSize: formatBytes(currentFile.size, 2),
											})}
										</FieldDescription>
									)}
								</Field>
							</>
						)}
					</FieldGroup>
				</ModalContent>
				<ModalFooter>
					<ModalFooterControllers>
						<Button secondary onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit' disabled={!isDirty && !isCompressed} loading={isSubmitting || isCompressing}>
							{t('Update')}
						</Button>
					</ModalFooterControllers>
				</ModalFooter>
			</Box>
		</Modal>
	);
};

export default memo(FileUploadModal);
