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
	Scrollable,
	Tile,
	Icon,
} from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import fileSize from 'filesize';
import type { ReactElement, ChangeEvent, FormEventHandler, ComponentProps } from 'react';
import React, { memo, useState, useEffect } from 'react';

import FilePreview from './FilePreview';

type FileUploadModalProps = {
	onClose: () => void;
	queue?: File[];
	onSubmit: (name: string, description?: string) => void;
	file: File;
	updateQueue: (queue: File[]) => void;
	fileName: string;
	fileDescription?: string;
	invalidContentType: boolean;
	showDescription?: boolean;
};

const FileUploadModal = ({
	onClose,
	queue = [],
	updateQueue,
	file,
	fileName,
	fileDescription,
	onSubmit,
	invalidContentType,
	showDescription = true,
}: FileUploadModalProps): ReactElement => {
	const [description, setDescription] = useState<string>(fileDescription || '');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const maxFileSize = useSetting('FileUpload_MaxFileSize') as number;

	const ref = useAutoFocus<HTMLInputElement>();

	const handleDescription = (e: ChangeEvent<HTMLInputElement>): void => {
		setDescription(e.currentTarget.value);
	};
	const [queue1, setQueue1] = useState<File[]>(queue);

	const handleremove = (index: number) => {
		const temp = queue1.filter((_, i) => {
			return i !== index;
		});
		setQueue1(temp);
	};

	const handleAddfile = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.click();
		input.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			const files = Array.from(target.files as FileList);
			setQueue1([...queue1, ...files]);
			updateQueue([...queue1, ...files]);
		};
	};

	const handleSubmit: FormEventHandler<HTMLFormElement> = async (e): Promise<void> => {
		e.preventDefault();
		if (queue.length > 6) {
			dispatchToastMessage({
				type: 'error',
				message: "You can't upload more than 6 files at once",
			});
			onClose();
			return;
		}

		// Iterate over each file in the queue
		for (const queuedFile of queue) {
			const { name: queuedFileName, size: queuedFileSize, type: queuedFileType } = queuedFile;
			if (!queuedFileName) {
				dispatchToastMessage({
					type: 'error',
					message: t('error-the-field-is-required', { field: t('Name') }),
				});
				return;
			}

			// Validate file size
			if (maxFileSize > -1 && (queuedFileSize || 0) > maxFileSize) {
				onClose();
				dispatchToastMessage({
					type: 'error',
					message: `${t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) })}+" hello testing"`,
				});
				return;
			}

			// Validate file content type
			if (invalidContentType) {
				dispatchToastMessage({
					type: 'error',
					message: t('FileUpload_MediaType_NotAccepted__type__', { type: queuedFileType }),
				});
				onClose();
				return;
			}
		}
		// 	description,
		// 	msg, // Assuming msg is defined elsewhere
		// });

		// Clear the composer after each file submission
		// chat.composer?.clear();
		const msg = description;
		console.log('hello testing from send msg here ', msg);
		onSubmit(fileName, msg);

		// Close the modal after all files are submitted
		// imperativeModal.close();
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
		<Modal wrapperFunction={(props: ComponentProps<typeof Box>) => <Box is='form' onSubmit={handleSubmit} {...props} />}>
			<Box display='flex' flexDirection='column' height='100%'>
				<Modal.Header>
					<Modal.Title>{t('FileUpload')}</Modal.Title>
					<Modal.Close onClick={onClose} />
				</Modal.Header>
				<Modal.Content>
					<Scrollable vertical>
						<Tile padding='none'>
							{queue1.length > 0 &&
								queue1.map((file, index) => <FilePreview key={index} file={file} index={index} onRemove={handleremove} />)}
						</Tile>
					</Scrollable>
					<FieldGroup>
						{showDescription && (
							<Field>
								<FieldLabel>{t('Upload_file_description')}</FieldLabel>
								<FieldRow>
									<TextInput value={description} onChange={handleDescription} placeholder={t('Description')} ref={ref} />
								</FieldRow>
							</Field>
						)}
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer justifyContent='space-between'>
					<Modal.FooterAnnotation>
						<Button secondary onClick={handleAddfile}>
							<Icon name='plus-small' size='x20' />
							<input style={{ display: 'none' }} onChange={handleAddfile} type='file' id='fileInput' />
							Add File
						</Button>
					</Modal.FooterAnnotation>
					<Modal.FooterControllers>
						<Button secondary onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit'>
							{t('Send')}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(FileUploadModal);
