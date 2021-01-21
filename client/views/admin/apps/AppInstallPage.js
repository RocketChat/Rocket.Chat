import { Button, ButtonGroup, Icon, Field, FieldGroup, TextInput, Throbber } from '@rocket.chat/fuselage';
import React, { useCallback, useEffect, useState } from 'react';
import { unzipSync, strFromU8 } from 'fflate';

import Page from '../../../components/Page';
import { useRoute, useQueryStringParameter } from '../../../contexts/RouterContext';
import { useEndpoint, useUpload } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import { useForm } from '../../../hooks/useForm';
import { handleInstallError } from './helpers';
import AppPermissionsReviewModal from './AppPermissionsReviewModal';
import { useSetModal } from '../../../contexts/ModalContext';

const placeholderUrl = 'https://rocket.chat/apps/package.zip';

async function fileToBuffer(file) {
	return new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onload = (e) => resolve(e.target.result);
		fileReader.onerror = (e) => reject(e);
		fileReader.readAsArrayBuffer(file);
	});
}

function unzipAppBuffer(zippedAppBuffer) {
	return unzipSync(new Uint8Array(zippedAppBuffer));
}

function getAppManifest(unzippedAppBuffer) {
	if (!unzippedAppBuffer['app.json']) {
		throw new Error('No app.json file found in the zip');
	}

	try {
		return JSON.parse(strFromU8(unzippedAppBuffer['app.json']));
	} catch (e) {
		throw new Error('Failed to parse app.json', e);
	}
}

function getPermissionsFromManifest(manifest) {
	if (!manifest.permissions) {
		return [];
	}

	if (!Array.isArray(manifest.permissions)) {
		throw new Error('The "permissions" property from app.json is invalid');
	}

	return manifest.permissions;
}

async function getPermissionsFromZippedApp(zippedApp, isFromFileInput = true) {
	let uint8buffer;
	try {
		if (isFromFileInput) {
			uint8buffer = await fileToBuffer(zippedApp);
		} else {
			uint8buffer = Uint8Array.from(zippedApp);
		}
		const unzippedBuffer = unzipAppBuffer(uint8buffer);
		const manifest = getAppManifest(unzippedBuffer);
		const permissions = getPermissionsFromManifest(manifest);
		return permissions;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

function AppInstallPage() {
	const t = useTranslation();

	const appsRoute = useRoute('admin-apps');
	const setModal = useSetModal();

	const appId = useQueryStringParameter('id');
	const queryUrl = useQueryStringParameter('url');

	const [installing, setInstalling] = useState(false);

	const endpointAddress = appId ? `/apps/${ appId }` : '/apps';
	const downloadApp = useEndpoint('POST', endpointAddress);
	const uploadApp = useUpload(endpointAddress);

	const { values, handlers } = useForm({
		file: {},
		url: queryUrl,
	});

	const {
		file,
		url,
	} = values;

	const canSave = !!url || !!file.name;

	const {
		handleFile,
		handleUrl,
	} = handlers;

	let appFile = file;

	useEffect(() => {
		queryUrl && handleUrl(queryUrl);
	}, [queryUrl, handleUrl]);

	const [handleUploadButtonClick] = useFileInput(handleFile, 'app');

	const sendFile = async (permissionsGranted, appFile) => {
		const fileData = new FormData();
		fileData.append('app', appFile, appFile.name);
		fileData.append('permissions', permissionsGranted);
		const { app } = await uploadApp(fileData);
		appsRoute.push({ context: 'details', id: app.id });
		setModal(null);
	};

	const cancelAction = useCallback(() => {
		setInstalling(false);
		setModal(null);
	}, [setInstalling, setModal]);

	const install = useCallback(async () => {
		setInstalling(true);

		try {
			let permissions;
			if (url) {
				const { buff: { data } } = await downloadApp({ url });
				permissions = await getPermissionsFromZippedApp(data, false);
				appFile = new File([Uint8Array.from(data)], 'app.zip', { type: 'application/zip' });
			} else {
				permissions = await getPermissionsFromZippedApp(appFile);
			}

			setModal(<AppPermissionsReviewModal appPermissions={permissions} cancel={cancelAction} confirm={(permissions) => sendFile(permissions, appFile)} />);
		} catch (error) {
			handleInstallError(error);
		} finally {
			setInstalling(false);
		}
	}, [url, downloadApp, appFile, appsRoute, sendFile, cancelAction]);

	const handleCancel = () => {
		appsRoute.push();
	};

	return <Page flexDirection='column'>
		<Page.Header title={t('App_Installation')} />
		<Page.ScrollableContent>
			<FieldGroup display='flex' flexDirection='column' alignSelf='center' maxWidth='x600' w='full'>
				<Field>
					<Field.Label>{t('App_Url_to_Install_From')}</Field.Label>
					<Field.Row>
						<TextInput placeholder={placeholderUrl} value={url} onChange={handleUrl} addon={<Icon name='permalink' size='x20'/>}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('App_Url_to_Install_From_File')}</Field.Label>
					<Field.Row>
						<TextInput
							value={file.name || ''}
							addon={<Button small primary onClick={handleUploadButtonClick} mb='neg-x4' mie='neg-x8'>
								<Icon name='upload' size='x12' />{t('Browse_Files')}
							</Button>}
						/>
					</Field.Row>
				</Field>
				<Field>
					<ButtonGroup>
						<Button disabled={!canSave || installing} onClick={install}>
							{!installing && t('Install')}
							{installing && <Throbber inheritColor/>}
						</Button>
						<Button onClick={handleCancel}>{t('Cancel')}</Button>
					</ButtonGroup>
				</Field>
			</FieldGroup>
		</Page.ScrollableContent>
	</Page>;
}

export default AppInstallPage;
