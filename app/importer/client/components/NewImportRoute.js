import { Throbber } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useState } from 'react';

import { Page } from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useSetting } from '../../../../client/contexts/SettingsContext';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { APIClient } from '../../../utils/client';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { showImporterException } from '../functions/showImporterException';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';

import { Importers } from '..';

function NewImportRoute() {
	const t = useTranslation();

	const canRunImport = usePermission('run-import');

	const dispatchToastMessage = useToastMessageDispatch();

	const pathFor = (path, { hash } = {}) => FlowRouter.path(path, hash);

	const [preparing, setPreparing] = useState(false);
	const [importType, setImportType] = useState('');
	const [fileType, setFileType] = useState('upload');

	const pageTitle = () => {
		if (!importType) {
			return t('Import_New_File');
		}

		const importer = Importers.get(importType);
		if (!importer) {
			return t('Import_New_File');
		}

		return t('Importer_From_Description', { from: t(importer.name) });
	};

	const maxFileSize = useSetting('FileUpload_MaxFileSize');

	const fileSizeLimitMessage = () => {
		let message;

		if (maxFileSize > 0) {
			const sizeInKb = maxFileSize / 1024;
			const sizeInMb = sizeInKb / 1024;

			let fileSizeMessage;
			if (sizeInMb > 0) {
				fileSizeMessage = t('FileSize_MB', { fileSize: sizeInMb.toFixed(2) });
			} else if (sizeInKb > 0) {
				fileSizeMessage = t('FileSize_KB', { fileSize: sizeInKb.toFixed(2) });
			} else {
				fileSizeMessage = t('FileSize_Bytes', { fileSize: maxFileSize.toFixed(0) });
			}

			message = t('Importer_Upload_FileSize_Message', { maxFileSize: fileSizeMessage });
		} else {
			message = t('Importer_Upload_Unlimited_FileSize');
		}

		return message;
	};

	const prepareImportRoute = useRoute('admin-import-prepare');

	const handleImportFileChange = (event) => {
		const e = event.originalEvent || event;
		let { files } = e.target;
		if (!files || (files.length === 0)) {
			files = (e.dataTransfer != null ? e.dataTransfer.files : undefined) || [];
		}

		Array.from(files).forEach((file) => {
			setPreparing(true);

			const reader = new FileReader();

			reader.readAsDataURL(file);
			reader.onloadend = () => {
				APIClient.post('v1/uploadImportFile', {
					binaryContent: reader.result.split(';base64,')[1],
					contentType: file.type,
					fileName: file.name,
					importerKey: importType,
				}).then(() => {
					dispatchToastMessage({ type: 'success', message: t('File_uploaded_successfully') });
					prepareImportRoute.push();
				}).catch((error) => {
					if (error) {
						showImporterException(error);
						setPreparing(false);
					}
				});
			};
		});
	};

	const [fileUrl, setFileUrl] = useState('');

	const handleFileUrlChange = (event) => {
		setFileUrl(event.currentTarget.value);
	};

	const handleImportClick = () => {
		setPreparing(true);

		APIClient.post('v1/downloadPublicImportFile', {
			fileUrl,
			importerKey: importType,
		}).then(() => {
			dispatchToastMessage({ type: 'success', message: t('Import_requested_successfully') });
			prepareImportRoute.push();
		}).catch((error) => {
			if (error) {
				showImporterException(error);
				setPreparing(false);
			}
		});
	};

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <Page className='page-settings'>
		<Page.Header title={pageTitle()} />
		<Page.ContentShadowScroll>
			<a href={pathFor('admin-import')}><i className='icon-angle-left'></i> {t('Back_to_imports')}</a><br/><br/>
			{preparing ? (
				<Throbber justifyContent='center' />
			) : <>

				<div className='rocket-form'>
					<div className='section'>
						<div className='section-content'>
							<div className='input-line double-col'>
								<label>{t('Import_Type')}</label>
								<select name='import-type' className='import-type required rc-input__element' value={importType} onChange={(event) => setImportType(event.currentTarget.value) }>
									<option value=''>{t('Select_an_option')}</option>

									{Importers.getAll().map((importer) =>
										<option key={importer.key} value={importer.key}>{t(importer.name)}</option>,
									)}
								</select>
							</div>

							{importType && <>
								<div className='input-line double-col'>
									<label>{t('File_Type')}</label>
									<select name='file-type' className='file-type required rc-input__element' value={fileType} onChange={(event) => setFileType(event.currentTarget.value)}>
										<option value='upload'>{t('Upload')}</option>
										<option value='url'>{t('Public_URL')}</option>
										<option value='path'>{t('Server_File_Path')}</option>
									</select>
								</div>

								{fileType === 'upload' ? <>
									<div className='input-line double-col'>
										<label />
										<div className='section-content'>
											{fileSizeLimitMessage()}
										</div>
									</div>

									<div className='input-line double-col'>
										<label>{t('Importer_Source_File')}</label>
										<input type='file' className='import-file-input rc-input__element' onChange={handleImportFileChange} />
									</div>
								</> : <>
									{fileType && <>
										<div className='input-line double-col'>
											{(fileType === 'url' && <label>{t('File_URL')}</label>)
												|| (fileType === 'path' && <label>{t('File_Path')}</label>)}

											<input type='text' className='import-file-url rc-input__element' value={fileUrl} onChange={handleFileUrlChange} />
										</div>

										<div className='input-line double-col'>
											<label />
											<button type='button' className='rc-button rc-button--primary action import-btn' onClick={handleImportClick}>{t('Import')}</button>
										</div>
									</>}
								</>}
							</>}

						</div>

					</div>
				</div>


			</>}
		</Page.ContentShadowScroll>
	</Page>;
}

export default NewImportRoute;
