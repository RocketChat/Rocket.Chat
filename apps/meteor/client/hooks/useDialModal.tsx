import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo } from 'react';

import DialPadModal from '../../ee/client/voip/modal/DialPad/DialPadModal';
import { useIsVoipEnterprise } from '../contexts/CallContext';
import { dispatchToastMessage } from '../lib/toast';

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
	const t = useTranslation();

	const closeDialModal = useCallback(() => setModal(null), [setModal]);

	const openDialModal = useCallback(
		({ initialValue, errorMessage }: DialModalProps = {}) => {
			if (!isEnterprise) {
				dispatchToastMessage({ type: 'error', message: t('You_do_not_have_permission_to_do_this') });
				return;
			}

			setModal(<DialPadModal initialValue={initialValue} errorMessage={errorMessage} handleClose={closeDialModal} />);
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
