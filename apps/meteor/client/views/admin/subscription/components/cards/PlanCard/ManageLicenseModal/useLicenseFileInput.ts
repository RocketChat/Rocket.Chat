import type { ChangeEvent, DragEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

const isFileDrag = (event: DragEvent<HTMLElement>) => event.dataTransfer.types.includes('Files');

export const useLicenseFileInput = (enterpriseLicense: string) => {
	const { t } = useTranslation();
	const [isDragOver, setIsDragOver] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File>();
	const [fileError, setFileError] = useState<string>();
	const [license, setLicense] = useState(enterpriseLicense);

	const handleFile = async (selected: File | undefined) => {
		if (!selected) {
			return;
		}

		if (!isTxtFile(selected)) {
			setSelectedFile(undefined);
			setFileError(t('Only_txt_license_files_are_supported'));
			return;
		}

		setFileError(undefined);
		setSelectedFile(selected);
		try {
			setLicense(await readFileAsText(selected));
		} catch {
			setSelectedFile(undefined);
			setLicense('');
			setFileError(t('Failed_to_read_file'));
		}
	};

	const handleRemoveFile = () => {
		setSelectedFile(undefined);
		setFileError(undefined);
		setLicense('');
	};

	const handleDrop = (event: DragEvent<HTMLElement>) => {
		if (!isFileDrag(event)) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		setIsDragOver(false);
		void handleFile(event.dataTransfer.files?.[0]);
	};

	const handleDragLeave = (event: DragEvent<HTMLElement>) => {
		if (!isDragOver) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		setIsDragOver(false);
	};

	const handleDragOver = (event: DragEvent<HTMLElement>) => {
		if (!isFileDrag(event)) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'copy';
		setIsDragOver(true);
	};

	const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setSelectedFile(undefined);
		setFileError(undefined);
		setLicense(event.currentTarget.value);
	};

	return {
		selectedFile,
		fileError,
		license,
		isDragOver,
		handleFile,
		handleRemoveFile,
		handleDrop,
		handleDragLeave,
		handleDragOver,
		handleTextChange,
	};
};
