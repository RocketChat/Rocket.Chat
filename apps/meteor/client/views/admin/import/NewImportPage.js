import {
	Box,
	Button,
	ButtonGroup,
	Callout,
	Chip,
	Field,
	Icon,
	Margins,
	Select,
	InputBox,
	TextInput,
	Throbber,
	UrlInput,
} from '@rocket.chat/fuselage';
import { useUniqueId, useSafely } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useRouteParameter, useSetting, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo, useEffect } from 'react';

import { Importers } from '../../../../app/importer/client/index';
import Page from '../../../components/Page';
import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';
import { useErrorHandler } from './useErrorHandler';

function NewImportPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleError = useErrorHandler();

	const [isLoading, setLoading] = useSafely(useState(false));
	const [fileType, setFileType] = useSafely(useState('upload'));
	const importerKey = useRouteParameter('importerKey');
	const importer = useMemo(() => Importers.get(importerKey), [importerKey]);

	const maxFileSize = useSetting('FileUpload_MaxFileSize');

	const importHistoryRoute = useRoute('admin-import');
	const newImportRoute = useRoute('admin-import-new');
	const prepareImportRoute = useRoute('admin-import-prepare');

	const uploadImportFile = useEndpoint('POST', 'uploadImportFile');
	const downloadPublicImportFile = useEndpoint('POST', 'downloadPublicImportFile');

	useEffect(() => {
		if (importerKey && !importer) {
			newImportRoute.replace();
		}
	}, [importer, importerKey, newImportRoute]);

	const formatMemorySize = useFormatMemorySize();

	const handleBackToImportsButtonClick = () => {
		importHistoryRoute.push();
	};

	const handleImporterKeyChange = (importerKey) => {
		newImportRoute.replace({ importerKey });
	};

	const handleFileTypeChange = (fileType) => {
		setFileType(fileType);
	};

	const [files, setFiles] = useState([]);

	const handleImportFileChange = async (event) => {
		event = event.originalEvent || event;
		let { files } = event.target;
		if (!files || files.length === 0) {
			files = (event.dataTransfer != null ? event.dataTransfer.files : undefined) || [];
		}

		setFiles(Array.from(files));
	};

	const handleFileUploadChipClick = (file) => () => {
		setFiles((files) => files.filter((_file) => _file !== file));
	};

	const handleFileUploadImportButtonClick = async () => {
		setLoading(true);

		try {
			await Promise.all(
				Array.from(
					files,
					(file) =>
						new Promise((resolve) => {
							const reader = new FileReader();
							reader.readAsDataURL(file);
							reader.onloadend = async () => {
								try {
									await uploadImportFile({
										binaryContent: reader.result.split(';base64,')[1],
										contentType: file.type,
										fileName: file.name,
										importerKey,
									});
									dispatchToastMessage({
										type: 'success',
										message: t('File_uploaded_successfully'),
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
			prepareImportRoute.push();
		} finally {
			setLoading(false);
		}
	};

	const [fileUrl, setFileUrl] = useSafely(useState(''));

	const handleFileUrlChange = (event) => {
		setFileUrl(event.currentTarget.value);
	};

	const handleFileUrlImportButtonClick = async () => {
		setLoading(true);

		try {
			await downloadPublicImportFile({ importerKey, fileUrl });
			dispatchToastMessage({ type: 'success', message: t('Import_requested_successfully') });
			prepareImportRoute.push();
		} catch (error) {
			handleError(error, t('Failed_To_upload_Import_File'));
		} finally {
			setLoading(false);
		}
	};

	const [filePath, setFilePath] = useSafely(useState(''));

	const handleFilePathChange = (event) => {
		setFilePath(event.currentTarget.value);
	};

	const handleFilePathImportButtonClick = async () => {
		setLoading(true);

		try {
			await downloadPublicImportFile({ importerKey, fileUrl: filePath });
			dispatchToastMessage({ type: 'success', message: t('Import_requested_successfully') });
			prepareImportRoute.push();
		} catch (error) {
			handleError(error, t('Failed_To_upload_Import_File'));
		} finally {
			setLoading(false);
		}
	};

	const importerKeySelectId = useUniqueId();
	const fileTypeSelectId = useUniqueId();
	const fileSourceInputId = useUniqueId();
	const handleImportButtonClick =
		(fileType === 'upload' && handleFileUploadImportButtonClick) ||
		(fileType === 'url' && handleFileUrlImportButtonClick) ||
		(fileType === 'path' && handleFilePathImportButtonClick);

	return (
		<Page className='page-settings'>
			<Page.Header title={t('Import_New_File')}>
				<ButtonGroup>
					<Button ghost onClick={handleBackToImportsButtonClick}>
						<Icon name='back' /> {t('Back_to_imports')}
					</Button>
					{importer && (
						<Button primary minHeight='x40' disabled={isLoading} onClick={handleImportButtonClick}>
							{isLoading ? <Throbber inheritColor /> : t('Import')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
					<Margins block='x24'>
						<Field>
							<Field.Label alignSelf='stretch' htmlFor={importerKeySelectId}>
								{t('Import_Type')}
							</Field.Label>
							<Field.Row>
								<Select
									id={importerKeySelectId}
									value={importerKey}
									disabled={isLoading}
									placeholder={t('Select_an_option')}
									onChange={handleImporterKeyChange}
									options={Importers.getAll().map(({ key, name }) => [key, t(name)])}
								/>
							</Field.Row>
							{importer && (
								<Field.Hint>
									{importer.name === 'CSV'
										? t('Importer_From_Description_CSV')
										: t('Importer_From_Description', { from: t(importer.name) })}
								</Field.Hint>
							)}
						</Field>
						{importer && (
							<Field>
								<Field.Label alignSelf='stretch' htmlFor={fileTypeSelectId}>
									{t('File_Type')}
								</Field.Label>
								<Field.Row>
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
								</Field.Row>
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
											<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>
												{t('Importer_Source_File')}
											</Field.Label>
											<Field.Row>
												<InputBox type='file' id={fileSourceInputId} onChange={handleImportFileChange} />
											</Field.Row>
											{files?.length > 0 && (
												<Field.Row>
													{files.map((file, i) => (
														<Chip key={i} onClick={handleFileUploadChipClick(file)}>
															{file.name}
														</Chip>
													))}
												</Field.Row>
											)}
										</Field>
									</>
								)}
								{fileType === 'url' && (
									<Field>
										<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>
											{t('File_URL')}
										</Field.Label>
										<Field.Row>
											<UrlInput id={fileSourceInputId} value={fileUrl} onChange={handleFileUrlChange} />
										</Field.Row>
									</Field>
								)}
								{fileType === 'path' && (
									<Field>
										<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>
											{t('File_Path')}
										</Field.Label>
										<Field.Row>
											<TextInput id={fileSourceInputId} value={filePath} onChange={handleFilePathChange} />
										</Field.Row>
									</Field>
								)}
							</>
						)}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default NewImportPage;
