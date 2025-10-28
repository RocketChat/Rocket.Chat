import type { App, AppPermission } from '@rocket.chat/core-typings';
import { useRouter, useSetModal, useUpload } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import { useAppsReload } from '../../../contexts/hooks/useAppsReload';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import AppExemptModal from '../AppExemptModal';
import AppPermissionsReviewModal from '../AppPermissionsReviewModal';
import AppUpdateModal from '../AppUpdateModal';
import { useAppsCountQuery } from './useAppsCountQuery';
import { handleAPIError } from '../helpers/handleAPIError';
import { handleInstallError } from '../helpers/handleInstallError';
import { getManifestFromZippedApp } from '../lib/getManifestFromZippedApp';

export const useInstallApp = (file: File): { install: () => void; isInstalling: boolean } => {
	const reloadAppsList = useAppsReload();
	const setModal = useSetModal();

	const router = useRouter();

	const appCountQuery = useAppsCountQuery('private');

	const uploadAppEndpoint = useUpload('/apps');
	const uploadUpdateEndpoint = useUpload('/apps/update');
	const { data } = useIsEnterprise();

	const [isInstalling, setInstalling] = useState(false);

	const { mutate: sendFile } = useMutation({
		mutationKey: ['apps/installPrivateApp'],

		mutationFn: ({ permissionsGranted, appFile, appId }: { permissionsGranted: AppPermission[]; appFile: File; appId?: string }) => {
			const fileData = new FormData();
			fileData.append('app', appFile, appFile.name);
			fileData.append('permissions', JSON.stringify(permissionsGranted));

			if (appId) {
				return uploadUpdateEndpoint(fileData);
			}

			return uploadAppEndpoint(fileData) as any;
		},

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
	});

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

	const handleAppPermissionsReview = async (permissions: AppPermission[], appFile: File, appId?: string) => {
		setModal(
			<AppPermissionsReviewModal
				appPermissions={permissions}
				onCancel={cancelAction}
				onConfirm={(permissionsGranted) => sendFile({ permissionsGranted, appFile, appId })}
			/>,
		);
	};

	const uploadFile = async (appFile: File, { id, permissions }: { id: string; permissions: AppPermission[] }) => {
		const isInstalled = await isAppInstalled(id);

		const isExempt = !data?.isEnterprise && isInstalled;
		if (isInstalled && isExempt) {
			return setModal(<AppExemptModal appName={appFile.name} onCancel={cancelAction} />);
		}

		if (isInstalled) {
			return setModal(<AppUpdateModal cancel={cancelAction} confirm={() => handleAppPermissionsReview(permissions, appFile, id)} />);
		}

		await handleAppPermissionsReview(permissions, appFile);
	};

	const extractManifestFromAppFile = async (appFile: File) => {
		try {
			return getManifestFromZippedApp(appFile);
		} catch (error) {
			handleInstallError(error as Error);
		}
	};

	const install = async () => {
		setInstalling(true);

		if (!appCountQuery.data) {
			return cancelAction();
		}

		const appFile = file;

		if (!appFile) {
			return cancelAction();
		}

		const manifest = await extractManifestFromAppFile(appFile);

		if (!manifest) {
			return cancelAction();
		}

		return uploadFile(appFile, manifest);
	};

	return { install, isInstalling };
};
