import { Box, Button, ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { FieldLabel, Field, FieldRow, TextAreaInput } from '@rocket.chat/fuselage-forms';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { FilePreviewIcon, GenericModal } from '@rocket.chat/ui-client';
import { useSettingSetValue, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, DragEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LicenseStatus from './LicenseStatus';
import { getLicenseInvalidMessage } from './getLicenseInvalidMessage';
import { getFileExtension } from '../../../../../../../lib/utils/getFileExtension';
import { formatBytes } from '../../../../../../lib/utils/formatBytes';
import { isPlausibleLicense, useValidateLicense } from '../../../hooks/useValidateLicense';

const isTxtFile = (file: File): boolean => file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

const readFileAsText = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const result = event.target?.result;
			if (typeof result === 'string') {
				resolve(result);
				return;
			}
			reject(new Error('Failed to read file'));
		};
		reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
		reader.readAsText(file);
	});

type ManageLicenseModalProps = {
	enterpriseLicense: string;
	onCancel: () => void;
};

const ManageLicenseModal = ({ enterpriseLicense, onCancel }: ManageLicenseModalProps) => {
	const { t } = useTranslation();
	const setEnterpriseLicense = useSettingSetValue('Enterprise_License');
	const dispatchToastMessage = useToastMessageDispatch();

	const inputRef = useRef<HTMLInputElement>(null);

	// Seed from the stored license so the modal shows its status as soon as it opens.
	const [license, setLicense] = useState(enterpriseLicense);
	const [selectedFile, setSelectedFile] = useState<File>();
	const [fileError, setFileError] = useState<string>();
	const [isDragOver, setIsDragOver] = useState(false);
	const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

	const trimmedLicense = license.trim();
	const debouncedLicense = useDebouncedValue(trimmedLicense, 500);
	const { data: reasons, isPending, isError } = useValidateLicense(debouncedLicense);

	const isEmpty = trimmedLicense === '';
	// Too short to be a complete license — treat as still-being-entered, don't validate or report.
	const isPlausible = isPlausibleLicense(trimmedLicense);
	// "Validating" covers both the debounce gap and the in-flight request.
	const isValidating = isPlausible && (trimmedLicense !== debouncedLicense || isPending);

	// The entered license is already the applied one — allow removal but not re-applying.
	const isCurrentLicense = !isEmpty && trimmedLicense === enterpriseLicense.trim();

	const isLicenseValid = !isError && reasons?.length === 0;

	const invalidMessage = fileError ?? t(getLicenseInvalidMessage(reasons ?? []));

	// Show the result once the input is a plausible license to validate (or a file error to surface).
	const showStatus = isPlausible || Boolean(fileError);

	const handleFile = async (selected: File | undefined) => {
		if (!selected) {
			return;
		}

		if (!isTxtFile(selected)) {
			setSelectedFile(undefined);
			setFileError('Only .txt license files are supported');
			return;
		}

		setFileError(undefined);
		setSelectedFile(selected);
		setLicense(await readFileAsText(selected));
	};

	const handleRemoveFile = () => {
		setSelectedFile(undefined);
		setFileError(undefined);
		setLicense('');
	};

	const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		// Editing by hand detaches the value from the dropped file.
		setSelectedFile(undefined);
		setFileError(undefined);
		setLicense(event.currentTarget.value);
	};

	const isFileDrag = (event: DragEvent<HTMLElement>) => event.dataTransfer.types.includes('Files');

	const handleDragOver = (event: DragEvent<HTMLElement>) => {
		if (!isFileDrag(event)) {
			return; // let the textarea handle text drags natively
		}
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'copy';
		setIsDragOver(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLElement>) => {
		if (!isDragOver) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		setIsDragOver(false);
	};

	const handleDrop = (event: DragEvent<HTMLElement>) => {
		if (!isFileDrag(event)) {
			return; // let the textarea handle text drops natively
		}
		event.preventDefault();
		event.stopPropagation();
		setIsDragOver(false);
		void handleFile(event.dataTransfer.files?.[0]);
	};

	const handleApply = async () => {
		try {
			await setEnterpriseLicense(license);
			onCancel();
			dispatchToastMessage({ type: 'success', message: 'License applied successfully' });
		} catch (err) {
			dispatchToastMessage({ type: 'error', message: err });
		}
	};

	const handleRemove = async () => {
		try {
			await setEnterpriseLicense('');
			onCancel();
			dispatchToastMessage({ type: 'success', message: 'License removed successfully' });
		} catch (err) {
			dispatchToastMessage({ type: 'error', message: err });
		}
	};

	if (isConfirmingRemoval) {
		return (
			<GenericModal
				variant='danger'
				title='Remove license?'
				confirmText='Remove license'
				onConfirm={handleRemove}
				onCancel={() => setIsConfirmingRemoval(false)}
				onClose={() => setIsConfirmingRemoval(false)}
			>
				Removing the license will revert this workspace to the Community edition and disable enterprise features. Are you sure you want to
				continue?
			</GenericModal>
		);
	}

	return (
		<GenericModal
			icon={null}
			variant='warning'
			title='Manage license'
			confirmText='Apply license'
			confirmDisabled={!isLicenseValid || isCurrentLicense || isValidating}
			onConfirm={handleApply}
			onCancel={onCancel}
		>
			<Box fontScale='p2' mbe={8}>
				Upload your license file or paste the key. We will validate it so you can confirm before applying.
			</Box>
			<Box
				is='input'
				ref={inputRef}
				type='file'
				accept='.txt,text/plain'
				display='none'
				onChange={(event: ChangeEvent<HTMLInputElement>) => {
					void handleFile(event.currentTarget.files?.[0]);
					// Reset so selecting the same file again still fires onChange.
					event.currentTarget.value = '';
				}}
			/>
			{selectedFile && (
				<Box display='flex' alignItems='center' padding={4} mbe={8} borderRadius={4} borderWidth={1} borderColor='extra-light'>
					<FilePreviewIcon format={getFileExtension(selectedFile.name) || 'txt'} />
					<Box flexGrow={1} withTruncatedText mis={8} display='flex' flexDirection='column'>
						<Box fontScale='p2' color='info' withTruncatedText>
							{selectedFile.name}
						</Box>
						<Box fontScale='c1' color='hint' textTransform='uppercase'>
							{`${formatBytes(selectedFile.size, 2)} - ${getFileExtension(selectedFile.name) || 'txt'}`}
						</Box>
					</Box>
					<IconButton icon='cross' tiny title='Remove file' onClick={handleRemoveFile} />
				</Box>
			)}
			<Field>
				<FieldLabel>License key</FieldLabel>
				<FieldRow>
					<TextAreaInput
						withRichContent
						mbe={8}
						width='100%'
						bg={isDragOver ? 'tint' : undefined}
						borderStyle={isDragOver ? 'dashed' : 'solid'}
						borderColor={isDragOver ? 'stroke-highlight' : 'stroke-light'}
						style={{ fontFamily: 'monospace' }}
						rows={5}
						placeholder='Drag and drop a file here, or paste your license string'
						value={license}
						onChange={handleTextChange}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragEnter={handleDragOver}
						onDragLeave={handleDragLeave}
					/>
				</FieldRow>
			</Field>
			<ButtonGroup>
				<Button icon='upload' small onClick={() => inputRef.current?.click()}>
					Upload license file
				</Button>
				{isCurrentLicense && (
					<Button icon='trash' small secondary danger onClick={() => setIsConfirmingRemoval(true)}>
						Remove license
					</Button>
				)}
			</ButtonGroup>
			{showStatus && (
				<Box mbs={16}>
					<LicenseStatus isValidating={isValidating} isValid={isLicenseValid} invalidMessage={invalidMessage} />
				</Box>
			)}
		</GenericModal>
	);
};

export default ManageLicenseModal;
