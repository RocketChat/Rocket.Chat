import { useEndpoint, useRole, useSetModal, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';

import FingerprintChangeModal from '../components/FingerprintChangeModal';
import FingerprintChangeModalConfirmation from '../components/FingerprintChangeModalConfirmation';

const reducer = (
	state: { openModal: boolean; openConfirmation: boolean; newWorkspace?: boolean },
	action: { type: 'openModal' | 'openConfirmation' | 'closeModal'; newWorkspace?: boolean },
) => {
	switch (action.type) {
		case 'openModal':
			return { openModal: true, openConfirmation: false, newWorkspace: undefined };
		case 'openConfirmation':
			return { openModal: false, openConfirmation: true, newWorkspace: action.newWorkspace };
		case 'closeModal':
			return { openModal: false, openConfirmation: false, newWorkspace: undefined };
		default:
			return state;
	}
};

export const useFingerprintChange = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isAdmin = useRole('admin');
	const setModal = useSetModal();
	const deploymentFingerPrintVerified = useSetting('Deployment_FingerPrint_Verified', true);
	const fingerprintEndpoint = useEndpoint('POST', '/v1/fingerprint');

	const [{ openConfirmation, openModal, newWorkspace }, dispatch] = useReducer(reducer, {
		openModal: false,
		openConfirmation: false,
		newWorkspace: undefined,
	});

	const { mutate: fingerPrintMutation } = useMutation({
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
		if (!isAdmin) {
			return;
		}
		if (deploymentFingerPrintVerified === null || deploymentFingerPrintVerified === true) {
			return;
		}
		dispatch({ type: 'openModal' });

		return () => {
			dispatch({ type: 'closeModal' });
		};
	}, [deploymentFingerPrintVerified, isAdmin]);

	useEffect(() => {
		if (!openModal && !openConfirmation) {
			setModal(null);
		}
		if (openModal) {
			setModal(
				<FingerprintChangeModal
					onConfirm={() => dispatch({ type: 'openConfirmation', newWorkspace: true })}
					onCancel={() => dispatch({ type: 'openConfirmation', newWorkspace: false })}
					onClose={() => dispatch({ type: 'closeModal' })}
				/>,
			);
		}

		if (openConfirmation && newWorkspace !== undefined) {
			setModal(
				<FingerprintChangeModalConfirmation
					onConfirm={() => {
						fingerPrintMutation(newWorkspace ? 'new-workspace' : 'updated-configuration');
						dispatch({ type: 'closeModal' });
					}}
					onCancel={() => dispatch({ type: 'openModal' })}
					onClose={() => dispatch({ type: 'closeModal' })}
					newWorkspace={newWorkspace}
				/>,
			);
		}
	}, [fingerPrintMutation, setModal, openConfirmation, openModal, newWorkspace]);
};
