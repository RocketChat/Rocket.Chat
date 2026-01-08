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
import {
	useToastMessageDispatch,
	useRouter,
	useRouteParameter,
	useSetting,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ChangeEvent, DragEvent, FormEvent, Key, SyntheticEvent } from 'react';
import { useState, useMemo, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useErrorHandler } from './useErrorHandler';
import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';

const ALLOWED_EXTENSIONS = ['csv', 'zip'];

function NewImportPage() {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleError = useErrorHandler();
	const router = useRouter();

	const [isLoading, setLoading] = useSafely(useState(false));
	const [fileType, setFileType] = useSafely(useState('upload'));
	const [files, setFiles] = useState<File[]>([]);
	const [fileUrl, setFileUrl] = useSafely(useState(''));
	const [filePath, setFilePath] = useSafely(useState(''));

	const importerKey = useRouteParameter('importerKey');
	const maxFileSize = useSetting('FileUpload_MaxFileSize', 0);
	const formatMemorySize = useFormatMemorySize();

	const listImportersEndpoint = useEndpoint('GET', '/v1/importers.list');
	const uploadImportFile = useEndpoint('POST', '/v1/uploadImportFile');
	const downloadPublicImportFile = useEndpoint('POST', '/v1/downloadPublicImportFile');

	const { data: importers, isPending } = useQuery({
		queryKey: ['importers'],
		queryFn: () => listImportersEndpoint(),
		refetchOnWindowFocus: false,
	});

	const importer = useMemo(
		() => importers?.find(({ key }) => key === importerKey),
		[importerKey, importers],
	);

	const options = useMemo(
		() => importers?.map(({ key, name }) => [key, t(name as TranslationKey)] as const) || [],
		[importers, t],
	);

	useEffect(() => {
		if (importerKey && !importer && !isPending) {
			router.navigate('/admin/import/new', { replace: true });
		}
	}, [importerKey, importer, isPending, router]);

	const isDataTransferEvent = <T extends SyntheticEvent>(
		event: T,
	): event is T & DragEvent<HTMLInputElement> =>
		Boolean('dataTransfer' in event && (event as any).dataTransfer?.files);

	/* =========================
	   FILE VALIDATION LOGIC
	   ========================= */
	const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		let selectedFiles = event.target.files;

		if ((!selectedFiles || selectedFiles.length === 0) && isDataTransferEvent(event)) {
			selectedFiles = event.dataTransfer.files;
		}

		const validFiles = Array.from(selectedFiles ?? []).filter((file) => {
			const ext = file.name.split('.').pop()?.toLowerCase();
			if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
				dispatchToastMessage({
					type: 'error',
					message: t('Only .csv or .zip files are supported'),
				});
				return false;
			}
			return true;
		});

		setFiles(validFiles);
	};

	const handleRemoveFile = (file: File) => () =>
		setFiles((prev) => prev.filter((f) => f !== file));

	const handleUpload = async () => {
		if (!importerKey || files.length === 0) {
			return;
		}

		setLoading(true);

		try {
			await Promise.all(
				files.map(
					(file) =>
						new Promise<void>((resolve) => {
							const reader = new FileReader();
							reader.readAsDataURL(file);
							reader.onloadend = async () => {
								try {
									await uploadImportFile({
										binaryContent: (reader.result as string).split(';base64,')[1],
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
						}),
				),
			);

			router.navigate('/admin/import/prepare');
		} finally {
			setLoading(false);
		}
	};

	const handleImportClick =
		(fileType === 'upload' && handleUpload) ||
		(fileType === 'url' &&
			(async () => {
				setLoading(true);
				try {
					await downloadPublicImportFile({ importerKey, fileUrl });
					router.navigate('/admin/import/prepare');
				} catch (error) {
					handleError(error, t('Failed_To_upload_Import_File'));
				} finally {
					setLoading(false);
				}
			})) ||
		(fileType === 'path' &&
			(async () => {
				setLoading(true);
				try {
					await downloadPublicImportFile({ importerKey, fileUrl: filePath });
					router.navigate('/admin/import/prepare');
				} catch (error) {
					handleError(error, t('Failed_To_upload_Import_File'));
				} finally {
					setLoading(false);
				}
			}));

	const importerSelectId = useId();
	const fileTypeSelectId = useId();
	const fileInputId = useId();

	return (
		<Page>
			<PageHeader title={t('Import_New_File')} onClickBack={() => router.navigate('/admin/import')}>
				<ButtonGroup>
					{importer && (
						<Button primary loading={isLoading} onClick={handleImportClick}>
							{t('Import')}
						</Button>
					)}
				</ButtonGroup>
			</PageHeader>

			<PageScrollableContentWithShadow>
				<Box maxWidth='x580' marginInline='auto'>
					<Margins block='x24'>
						<Field>
							<FieldLabel htmlFor={importerSelectId}>{t('Import_Type')}</FieldLabel>
							<FieldRow>
								<Select
									id={importerSelectId}
									value={importerKey}
									onChange={(key) =>
										typeof key === 'string' &&
										router.navigate(`/admin/import/new/${key}`, { replace: true })
									}
									options={options}
								/>
							</FieldRow>
							{importer && (
								<FieldHint>
									{t(
										importer.key === 'csv'
											? 'Importer_From_Description_CSV'
											: 'Importer_From_Description',
										{ from: t(importer.name as TranslationKey) },
									)}
								</FieldHint>
							)}
						</Field>

						{importer && (
							<Field>
								<FieldLabel htmlFor={fileTypeSelectId}>{t('File_Type')}</FieldLabel>
								<FieldRow>
									<Select
										id={fileTypeSelectId}
										value={fileType}
										onChange={(key) => typeof key === 'string' && setFileType(key)}
										options={[
											['upload', t('Upload')],
											['url', t('Public_URL')],
											['path', t('Server_File_Path')],
										]}
									/>
								</FieldRow>
							</Field>
						)}

						{fileType === 'upload' && (
							<>
								<Callout type='info'>
									{maxFileSize > 0
										? t('Importer_Upload_FileSize_Message', {
												maxFileSize: formatMemorySize(maxFileSize),
											})
										: t('Importer_Upload_Unlimited_FileSize')}
								</Callout>

								<Field>
									<FieldLabel htmlFor={fileInputId}>{t('Importer_Source_File')}</FieldLabel>
									<FieldRow>
										<InputBox
											id={fileInputId}
											type='file'
											accept='.csv,.zip'
											onChange={handleImportFileChange}
										/>
									</FieldRow>

									{files.length > 0 && (
										<FieldRow>
											{files.map((file) => (
												<Chip key={file.name} onClick={handleRemoveFile(file)}>
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
								<FieldLabel>{t('File_URL')}</FieldLabel>
								<FieldRow>
									<UrlInput value={fileUrl} onChange={(e) => setFileUrl(e.currentTarget.value)} />
								</FieldRow>
							</Field>
						)}

						{fileType === 'path' && (
							<Field>
								<FieldLabel>{t('File_Path')}</FieldLabel>
								<FieldRow>
									<TextInput value={filePath} onChange={(e) => setFilePath(e.currentTarget.value)} />
								</FieldRow>
							</Field>
						)}
					</Margins>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
}

export default NewImportPage;
