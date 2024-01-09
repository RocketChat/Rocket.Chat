import type { App, AppPermission } from '@rocket.chat/core-typings';
import { useRouter, useSetModal, useUpload, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';

import { AppClientOrchestratorInstance } from '../../../../ee/client/apps/orchestrator';
import { useAppsReload } from '../../../contexts/hooks/useAppsReload';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';
import AppPermissionsReviewModal from '../AppPermissionsReviewModal';
import AppUpdateModal from '../AppUpdateModal';
import AppInstallationModal from '../components/AppInstallModal/AppInstallModal';
import { handleAPIError } from '../helpers/handleAPIError';
import { handleInstallError } from '../helpers/handleInstallError';
import { getManifestFromZippedApp } from '../lib/getManifestFromZippedApp';
import { useAppsCountQuery } from './useAppsCountQuery';

export const useInstallApp = (file: File, url: string): { install: () => void; isInstalling: boolean } => {
	const reloadAppsList = useAppsReload();
	const openExternalLink = useExternalLink();
	const setModal = useSetModal();

	const router = useRouter();

	const appCountQuery = useAppsCountQuery('private');
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'marketplace-app-install', action: 'Enable_unlimited_apps' });

	const uploadAppEndpoint = useUpload('/apps');

	/** @deprecated */
	const downloadPrivateAppFromUrl = useEndpoint('POST', '/apps');

	const [isInstalling, setInstalling] = useState(false);

	const { mutate: sendFile } = useMutation(
		['apps/installPrivateApp'],
		({ permissionsGranted, appFile }: { permissionsGranted: AppPermission[]; appFile: File }) => {
			const fileData = new FormData();
			fileData.append('app', appFile, appFile.name);
			fileData.append('permissions', JSON.stringify(permissionsGranted));

			return uploadAppEndpoint(fileData) as any;
		},
		{
			onSuccess: (data: { app: App }) => {
				router.navigate({
					name: 'marketplace',
					params: {
						context: 'private',
						page: 'info',
						id: data.app.id,
					},
				});
			},
			onError: (e) => {
				handleAPIError(e);
			},
			onSettled: () => {
				setInstalling(false);
				setModal(null);
				reloadAppsList();
			},
		},
	);

	const cancelAction = useCallback(() => {
		setInstalling(false);
		setModal(null);
	}, [setInstalling, setModal]);

	const isAppInstalled = async (appId: string) => {
		try {
			const app = await AppClientOrchestratorInstance.getApp(appId);
			return !!app || false;
		} catch (e) {
			return false;
		}
	};

	const handleAppPermissionsReview = async (permissions: AppPermission[], appFile: File) => {
		setModal(
			<AppPermissionsReviewModal
				appPermissions={permissions}
				onCancel={cancelAction}
				onConfirm={(permissionsGranted) => sendFile({ permissionsGranted, appFile })}
			/>,
		);
	};

	const uploadFile = async (appFile: File, { id, permissions }: { id: string; permissions: AppPermission[] }) => {
		const isInstalled = await isAppInstalled(id);

		if (isInstalled) {
			return setModal(<AppUpdateModal cancel={cancelAction} confirm={() => handleAppPermissionsReview(permissions, appFile)} />);
		}

		await handleAppPermissionsReview(permissions, appFile);
	};

	/** @deprecated	*/
	const getAppFile = async (): Promise<File | undefined> => {
		try {
			// @ts-ignore-next-line
			const { buff } = await downloadPrivateAppFromUrl({ url, downloadOnly: true });

			return new File([Uint8Array.from(buff.data)], 'app.zip', { type: 'application/zip' });
		} catch (error) {
			handleInstallError(error as Error);
		}
	};

	const extractManifestFromAppFile = async (appFile: File) => {
		const manifest = await getManifestFromZippedApp(appFile);
		return manifest;
	};

	const install = async () => {
		let appFile: File | undefined;

		setInstalling(true);

		if (!appCountQuery.data) {
			return cancelAction();
		}

		if (!file) {
			appFile = await getAppFile();
		} else {
			appFile = file;
		}

		if (!appFile) {
			return cancelAction();
		}

		const manifest = await extractManifestFromAppFile(appFile);

		if (!manifest) {
			return cancelAction();
		}

		if (appCountQuery.data.hasUnlimitedApps) {
			return uploadFile(appFile, manifest);
		}

		setModal(
			<AppInstallationModal
				context='private'
				enabled={appCountQuery.data.enabled}
				limit={appCountQuery.data.limit}
				appName={manifest.name}
				handleClose={cancelAction}
				handleConfirm={() => uploadFile(appFile as File, manifest)}
				handleEnableUnlimitedApps={() => {
					openExternalLink(manageSubscriptionUrl);
					setModal(null);
				}}
			/>,
		);
	};

	return { install, isInstalling };
};
