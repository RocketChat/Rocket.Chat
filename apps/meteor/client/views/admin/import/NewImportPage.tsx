import {
	Box,
	Button,
	ButtonGroup,
	Callout,
	Chip,
	Field,
	Margins,
	Select,
	InputBox,
	TextInput,
	UrlInput,
	FieldLabel,
	FieldRow,
	FieldHint,
} from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useRouter, useRouteParameter, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ChangeEvent, DragEvent, FormEvent, Key, SyntheticEvent } from 'react';
import { useState, useMemo, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useErrorHandler } from './useErrorHandler';
import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';

// TODO: review inner logic
function NewImportPage() {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleError = useErrorHandler();

	const [isLoading, setLoading] = useSafely(useState(false));
	const [fileType, setFileType] = useSafely(useState('upload'));

	const listImportersEndpoint = useEndpoint('GET', '/v1/importers.list');
	const { data: importers, isPending: isLoadingImporters } = useQuery({
		queryKey: ['importers'],
		queryFn: async () => listImportersEndpoint(),
		refetchOnWindowFocus: false,
	});

	const options = useMemo(() => importers?.map(({ key, name }) => [key, t(name as TranslationKey)] as const) || [], [importers, t]);

	const importerKey = useRouteParameter('importerKey');
	const importer = useMemo(() => (importers || []).find(({ key }) => key === importerKey), [importerKey, importers]);

	const maxFileSize = useSetting('FileUpload_MaxFileSize', 0);

	const router = useRouter();

	const uploadImportFile = useEndpoint('POST', '/v1/uploadImportFile');
	const downloadPublicImportFile = useEndpoint('POST', '/v1/downloadPublicImportFile');

	useEffect(() => {
		if (importerKey && !importer && !isLoadingImporters) {
			router.navigate('/admin/import/new', { replace: true });
		}
	}, [importer, importerKey, router, isLoadingImporters]);

	const formatMemorySize = useFormatMemorySize();

	const handleImporterKeyChange = (importerKey: Key) => {
		if (typeof importerKey !== 'string') {
			return;
		}

		router.navigate(
			{
				pattern: '/admin/import/new/:importerKey?',
				params: { importerKey },
			},
			{ replace: true },
		);
	};

	const handleFileTypeChange = (fileType: Key) => {
		if (typeof fileType !== 'string') {
			return;
		}

		setFileType(fileType);
	};

	const [files, setFiles] = useState<File[]>([]);

	const isDataTransferEvent = <T extends SyntheticEvent>(event: T): event is T & DragEvent<HTMLInputElement> =>
		Boolean('dataTransfer' in event && (event as any).dataTransfer.files);

	const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		let { files } = event.target;
		if (!files || files.length === 0) {
			if (isDataTransferEvent(event)) {
				files = event.dataTransfer.files;
			}
		}

		setFiles(Array.from(files ?? []));
	};

	const handleFileUploadChipClick = (file: File) => () => {
		setFiles((files) => files.filter((_file) => _file !== file));
	};

	const handleFileUploadImportButtonClick = async () => {
		if (!importerKey) {
			return;
		}

		setLoading(true);

		try {
			await Promise.all(
				Array.from(
					files,
					(file) =>
						new Promise<void>((resolve) => {
							const reader = new FileReader();
							reader.readAsDataURL(file);
							reader.onloadend = async () => {
								const result = reader.result as string;
								try {
									await uploadImportFile({
										binaryContent: result.split(';base64,')[1],
										contentType: file.type,
										fileName: file.name,
										importerKey,
									});
								} catch (error) {
									handleError(error, t('Failed_To_upload_Import_File'));
								} finally {
									resolve();
								}
							};
							reader.onerror = () => resolve();
						}),
				),
			);
			router.navigate('/admin/import/prepare');
		} finally {
			setLoading(false);
		}
	};

	const [fileUrl, setFileUrl] = useSafely(useState(''));

	const handleFileUrlChange = (event: FormEvent<HTMLInputElement>) => {
		setFileUrl(event.currentTarget.value);
	};

	const handleFileUrlImportButtonClick = async () => {
		if (!importerKey) {
			return;
		}

		setLoading(true);

		try {
			await downloadPublicImportFile({ importerKey, fileUrl });
			dispatchToastMessage({ type: 'success', message: t('Import_requested_successfully') });
			router.navigate('/admin/import/prepare');
		} catch (error) {
			handleError(error, t('Failed_To_upload_Import_File'));
		} finally {
			setLoading(false);
		}
	};

	const [filePath, setFilePath] = useSafely(useState(''));

	const handleFilePathChange = (event: FormEvent<HTMLInputElement>) => {
		setFilePath(event.currentTarget.value);
	};

	const handleFilePathImportButtonClick = async () => {
		if (!importerKey) {
			return;
		}

		setLoading(true);

		try {
			await downloadPublicImportFile({ importerKey, fileUrl: filePath });
			dispatchToastMessage({ type: 'success', message: t('Import_requested_successfully') });
			router.navigate('/admin/import/prepare');
		} catch (error) {
			handleError(error, t('Failed_To_upload_Import_File'));
		} finally {
			setLoading(false);
		}
	};

	const importerKeySelectId = useId();
	const fileTypeSelectId = useId();
	const fileSourceInputId = useId();
	const handleImportButtonClick =
		(fileType === 'upload' && handleFileUploadImportButtonClick) ||
		(fileType === 'url' && handleFileUrlImportButtonClick) ||
		(fileType === 'path' && handleFilePathImportButtonClick) ||
		undefined;

	return (
		<Page>
			<PageHeader title={t('Import_New_File')} onClickBack={() => router.navigate('/admin/import')}>
				<ButtonGroup>
					{importer && (
						<Button primary minHeight='x40' loading={isLoading} onClick={handleImportButtonClick}>
							{t('Import')}
						</Button>
					)}
				</ButtonGroup>
			</PageHeader>
			<PageScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
					<Margins block='x24'>
						<Field>
							<FieldLabel alignSelf='stretch' htmlFor={importerKeySelectId}>
								{t('Import_Type')}
							</FieldLabel>
							<FieldRow>
								<Select
									id={importerKeySelectId}
									value={importerKey}
									disabled={isLoading}
									placeholder={t('Select_an_option')}
									onChange={handleImporterKeyChange}
									options={options}
								/>
							</FieldRow>
							{importer && (
								<FieldHint>
									{importer.key === 'csv'
										? t('Importer_From_Description_CSV')
										: t('Importer_From_Description', { from: t(importer.name as TranslationKey) })}
								</FieldHint>
							)}
						</Field>
						{importer && (
							<Field>
								<FieldLabel alignSelf='stretch' htmlFor={fileTypeSelectId}>
									{t('File_Type')}
								</FieldLabel>
								<FieldRow>
									<Select
										id={fileTypeSelectId}
										value={fileType}
										disabled={isLoading}
										placeholder={t('Select_an_option')}
										onChange={handleFileTypeChange}
										options={[
											['upload', t('Upload')],
											['url', t('Public_URL')],
											['path', t('Server_File_Path')],
										]}
									/>
								</FieldRow>
							</Field>
						)}
						{importer && (
							<>
								{fileType === 'upload' && (
									<>
										{maxFileSize > 0 ? (
											<Callout type='warning' marginBlock='x16'>
												{t('Importer_Upload_FileSize_Message', {
													maxFileSize: formatMemorySize(maxFileSize),
												})}
											</Callout>
										) : (
											<Callout type='info' marginBlock='x16'>
												{t('Importer_Upload_Unlimited_FileSize')}
											</Callout>
										)}
										<Field>
											<FieldLabel alignSelf='stretch' htmlFor={fileSourceInputId}>
												{t('Importer_Source_File')}
											</FieldLabel>
											<FieldRow>
												<InputBox type='file' id={fileSourceInputId} onChange={handleImportFileChange} />
											</FieldRow>
											{files?.length > 0 && (
												<FieldRow>
													{files.map((file, i) => (
														<Chip key={i} onClick={handleFileUploadChipClick(file)}>
															{file.name}
														</Chip>
													))}
												</FieldRow>
											)}
										</Field>
									</>
								)}
								{fileType === 'url' && (
									<Field>
										<FieldLabel alignSelf='stretch' htmlFor={fileSourceInputId}>
											{t('File_URL')}
										</FieldLabel>
										<FieldRow>
											<UrlInput id={fileSourceInputId} value={fileUrl} onChange={handleFileUrlChange} />
										</FieldRow>
									</Field>
								)}
								{fileType === 'path' && (
									<Field>
										<FieldLabel alignSelf='stretch' htmlFor={fileSourceInputId}>
											{t('File_Path')}
										</FieldLabel>
										<FieldRow>
											<TextInput id={fileSourceInputId} value={filePath} onChange={handleFilePathChange} />
										</FieldRow>
									</Field>
								)}
							</>
						)}
					</Margins>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
}

export default NewImportPage;
