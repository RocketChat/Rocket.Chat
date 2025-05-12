import { useEndpoint, useRole, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Roles } from '../../app/models/client';
import FingerprintChangeModal from '../components/FingerprintChangeModal';
import FingerprintChangeModalConfirmation from '../components/FingerprintChangeModalConfirmation';
import { imperativeModal } from '../lib/imperativeModal';
import { isSyncReady } from '../lib/userData';

export const useFingerprintChange = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isAdmin = useRole('admin');

	const deploymentFingerPrintVerified = useSetting('Deployment_FingerPrint_Verified', true);
	const fingerprintEndpoint = useEndpoint('POST', '/v1/fingerprint');

	const fingerPrintMutation = useMutation({
		mutationKey: ['settings', 'Deployment_FingerPrint_Verified'],
		mutationFn: async (setDeploymentAs: 'new-workspace' | 'updated-configuration') => {
			const result = await fingerprintEndpoint({ setDeploymentAs });
			return {
				...result,
				setDeploymentAs,
			};
		},
		onSuccess: ({ setDeploymentAs }) => {
			if (setDeploymentAs === 'new-workspace') {
				return dispatchToastMessage({ type: 'success', message: t('New_workspace_confirmed') });
			}
			return dispatchToastMessage({ type: 'success', message: t('Configuration_update_confirmed') });
		},
	});

	useEffect(() => {
		if (!Roles.ready.get() || !isSyncReady.get()) {
			return;
		}

		if (!isAdmin) {
			return;
		}

		if (deploymentFingerPrintVerified === null || deploymentFingerPrintVerified === true) {
			return;
		}

		const updateWorkspace = (): void => {
			imperativeModal.close();
			fingerPrintMutation.mutate('updated-configuration');
		};

		const setNewWorkspace = (): void => {
			imperativeModal.close();
			fingerPrintMutation.mutate('new-workspace');
		};
		const openModal = (): void => {
			imperativeModal.open({
				component: FingerprintChangeModal,
				props: {
					onConfirm: () => {
						imperativeModal.close();

						imperativeModal.open({
							component: FingerprintChangeModalConfirmation,
							props: {
								onConfirm: setNewWorkspace,
								onCancel: openModal,
								newWorkspace: true,
							},
						});
					},
					onCancel: () => {
						imperativeModal.close();

						imperativeModal.open({
							component: FingerprintChangeModalConfirmation,
							props: {
								onConfirm: updateWorkspace,
								onCancel: openModal,
								newWorkspace: false,
							},
						});
					},
					onClose: imperativeModal.close,
				},
			});
		};

		openModal();

		return () => {
			if (deploymentFingerPrintVerified) {
				imperativeModal.close();
			}
		};
	}, [deploymentFingerPrintVerified, fingerPrintMutation, isAdmin]);
};
