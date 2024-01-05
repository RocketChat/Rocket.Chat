import { Button, ButtonGroup, Icon, Field, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useEndpoint,
	useUpload,
	useTranslation,
	useRouteParameter,
	useRouter,
	useSearchParameter,
} from '@rocket.chat/ui-contexts';
import React, { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { AppClientOrchestratorInstance } from '../../../ee/client/apps/orchestrator';
import { Page, PageHeader, PageScrollableContent } from '../../components/Page';
import { useAppsReload } from '../../contexts/hooks/useAppsReload';
import { useExternalLink } from '../../hooks/useExternalLink';
import { useSingleFileInput } from '../../hooks/useSingleFileInput';
import { useCheckoutUrl } from '../admin/subscription/hooks/useCheckoutUrl';
import AppPermissionsReviewModal from './AppPermissionsReviewModal';
import AppUpdateModal from './AppUpdateModal';
import AppInstallModal from './components/AppInstallModal/AppInstallModal';
import { handleAPIError } from './helpers/handleAPIError';
import { handleInstallError } from './helpers/handleInstallError';
import { useAppsCountQuery } from './hooks/useAppsCountQuery';
import { getManifestFromZippedApp } from './lib/getManifestFromZippedApp';

const placeholderUrl = 'https://rocket.chat/apps/package.zip';

function AppInstallPage() {
	const t = useTranslation();

	const reload = useAppsReload();

	const router = useRouter();

	const context = useRouteParameter('context');

	const setModal = useSetModal();

	const appId = useSearchParameter('id');
	const queryUrl = useSearchParameter('url');

	const [installing, setInstalling] = useState(false);

	const endpointAddress = appId ? `/apps/${appId}` : '/apps';
	const downloadApp = useEndpoint('POST', endpointAddress);
	const uploadAppEndpoint = useUpload(endpointAddress);
	const uploadUpdateApp = useUpload(`${endpointAddress}/update`);

	const appCountQuery = useAppsCountQuery('private');

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'marketplace-app-install', action: 'Enable_unlimited_apps' });

	const { control, setValue, watch } = useForm({ defaultValues: { url: queryUrl || '' } });
	const { file, url } = watch();

	const canSave = !!url || !!file?.name;

	const [handleUploadButtonClick] = useSingleFileInput((value) => setValue('file', value), 'app');

	const sendFile = async (permissionsGranted, appFile, appId) => {
		let app;
		const fileData = new FormData();
		fileData.append('app', appFile, appFile.name);
		fileData.append('permissions', JSON.stringify(permissionsGranted));

		try {
			if (appId) {
				await uploadUpdateApp(fileData);
			} else {
				app = await uploadAppEndpoint(fileData);
			}

			router.navigate({
				name: 'marketplace',
				params: {
					context: 'private',
					page: 'info',
					id: appId || app.app.id,
				},
			});

			reload();
		} catch (e) {
			handleAPIError(e);
		} finally {
			setInstalling(false);
			setModal(null);
		}
	};

	const cancelAction = useCallback(() => {
		setInstalling(false);
		setModal(null);
	}, [setInstalling, setModal]);

	const isAppInstalled = async (appId) => {
		try {
			const app = await AppClientOrchestratorInstance.getApp(appId);
			return !!app || false;
		} catch (e) {
			return false;
		}
	};

	const handleAppPermissionsReview = async (permissions, appFile, appId) => {
		setModal(
			<AppPermissionsReviewModal
				appPermissions={permissions}
				onCancel={cancelAction}
				onConfirm={(permissionsGranted) => sendFile(permissionsGranted, appFile, appId)}
			/>,
		);
	};

	const uploadFile = async (appFile, { id, permissions }) => {
		const isInstalled = await isAppInstalled(id);

		if (isInstalled) {
			return setModal(<AppUpdateModal cancel={cancelAction} confirm={() => handleAppPermissionsReview(permissions, appFile, id)} />);
		}

		await handleAppPermissionsReview(permissions, appFile);
	};

	const getAppFileAndManifest = async () => {
		try {
			let manifest;
			let appFile;
			if (url) {
				const { buff } = await downloadApp({ url, downloadOnly: true });
				const fileData = Uint8Array.from(buff.data);
				manifest = await getManifestFromZippedApp(fileData);
				appFile = new File([fileData], 'app.zip', { type: 'application/zip' });
			} else {
				appFile = file;
				manifest = await getManifestFromZippedApp(appFile);
			}

			return { appFile, manifest };
		} catch (error) {
			handleInstallError(error);

			return { appFile: null, manifest: null };
		}
	};

	const install = async () => {
		setInstalling(true);

		if (!appCountQuery.data) {
			return cancelAction();
		}

		const { appFile, manifest } = await getAppFileAndManifest();

		if (!appFile || !manifest) {
			return cancelAction();
		}

		if (appCountQuery.data.hasUnlimitedApps) {
			return uploadFile(appFile, manifest);
		}

		setModal(
			<AppInstallModal
				context={context}
				enabled={appCountQuery.data.enabled}
				limit={appCountQuery.data.limit}
				appName={manifest.name}
				handleClose={cancelAction}
				handleConfirm={() => uploadFile(appFile, manifest)}
				handleEnableUnlimitedApps={() => {
					openExternalLink(manageSubscriptionUrl);
					setModal(null);
				}}
			/>,
		);
	};

	const handleCancel = () => {
		router.navigate({
			name: 'marketplace',
			params: {
				context,
				page: 'list',
			},
		});
	};

	const urlField = useUniqueId();
	const fileField = useUniqueId();

	return (
		<Page flexDirection='column'>
			<PageHeader title={t('App_Installation')} />
			<PageScrollableContent>
				<FieldGroup display='flex' flexDirection='column' alignSelf='center' maxWidth='x600' w='full'>
					<Field>
						<FieldLabel htmlFor={urlField}>{t('App_Url_to_Install_From')}</FieldLabel>
						<FieldRow>
							<Controller
								name='url'
								control={control}
								render={({ field }) => (
									<TextInput id={urlField} placeholder={placeholderUrl} addon={<Icon name='permalink' size='x20' />} {...field} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={fileField}>{t('App_Url_to_Install_From_File')}</FieldLabel>
						<FieldRow>
							<Controller
								name='file'
								control={control}
								render={({ field }) => (
									<TextInput
										id={fileField}
										readOnly
										{...field}
										value={field.value?.name || ''}
										addon={
											<Button icon='upload' small primary onClick={handleUploadButtonClick} mb='neg-x4' mie='neg-x8'>
												{t('Browse_Files')}
											</Button>
										}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<ButtonGroup>
							<Button disabled={!canSave} loading={installing} onClick={install}>
								{t('Install')}
							</Button>
							<Button onClick={handleCancel}>{t('Cancel')}</Button>
						</ButtonGroup>
					</Field>
				</FieldGroup>
			</PageScrollableContent>
		</Page>
	);
}

export default AppInstallPage;
