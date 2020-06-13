import { Button, ButtonGroup, Icon, Field, FieldGroup, TextInput, Throbber } from '@rocket.chat/fuselage';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import Page from '../../components/basic/Page';
import { useFileInput } from '../../hooks/useFileInput';
import { useTranslation } from '../../contexts/TranslationContext';
import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import { handleInstallError } from './helpers';
import { APIClient } from '../../../app/utils';
import { useForm } from '../../hooks/useForm';

const placeholderUrl = 'https://rocket.chat/apps/package.zip';

function AppInstallPage() {
	const t = useTranslation();

	const [appId, setAppId] = useState(null);
	const [installing, setInstalling] = useState(false);

	const { values, handlers } = useForm({
		file: {},
		url: '',
	});

	const {
		file,
		url,
	} = values;

	const canSave = useMemo(() => !!url || !!file.name);

	const {
		handleFile,
		handleUrl,
	} = handlers;

	const currentRoute = useCurrentRoute();
	const { url: queryUrl, id: queryId } = currentRoute[2];

	const appRouter = useRoute('admin-apps');

	useEffect(() => {
		queryUrl && handleUrl(queryUrl);
		queryId && setAppId(queryId);
	}, [queryUrl, queryId]);

	const onSetFile = useCallback((file) => {
		handleFile(file);
	}, []);

	const onClickUpload = useFileInput(onSetFile, 'app');

	const endpointAddress = (appId && `apps/${ appId }`) || 'apps';

	const install = useCallback(async () => {
		setInstalling(true);

		let result;
		try {
			if (url) {
				result = await APIClient.post(endpointAddress, { url });
			} else {
				const fileData = new FormData();
				fileData.append('app', file, file.name);
				result = await APIClient.upload(endpointAddress, fileData).promise;
			}
			appRouter.push({ context: 'details', id: result.app.id });
		} catch (error) {
			handleInstallError(error);
		}

		setInstalling(false);
	}, [url, file, endpointAddress]);

	const handleCancel = useCallback(() => appRouter.push({}), []);

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
							addon={<Button small primary onClick={onClickUpload} mb='neg-x4' mie='neg-x8'>
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
