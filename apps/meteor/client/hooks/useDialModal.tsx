import { useSetModal } from '@rocket.chat/ui-contexts';
import { Suspense, lazy, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsVoipEnterprise } from '../contexts/CallContext';
import { dispatchToastMessage } from '../lib/toast';

const DialPadModal = lazy(() => import('../voip/modal/DialPad/DialPadModal'));

type DialModalProps = {
	initialValue?: string;
	errorMessage?: string;
};

type DialModalControls = {
	openDialModal: (props?: DialModalProps) => void;
	closeDialModal: () => void;
};

export const useDialModal = (): DialModalControls => {
	const setModal = useSetModal();
	const isEnterprise = useIsVoipEnterprise();
	const { t } = useTranslation();

	const closeDialModal = useCallback(() => setModal(null), [setModal]);

	const openDialModal = useCallback(
		({ initialValue, errorMessage }: DialModalProps = {}) => {
			if (!isEnterprise) {
				dispatchToastMessage({ type: 'error', message: t('You_do_not_have_permission_to_do_this') });
				return;
			}

			setModal(
				// TODO: Revisit Modal's FocusScope which currently does not accept null as children.
				// Added dummy div fallback for that reason.
				<Suspense fallback={<div />}>
					<DialPadModal initialValue={initialValue} errorMessage={errorMessage} handleClose={closeDialModal} />
				</Suspense>,
			);
		},
		[setModal, isEnterprise, t, closeDialModal],
	);

	return useMemo(
		() => ({
			openDialModal,
			closeDialModal,
		}),
		[openDialModal, closeDialModal],
	);
};
