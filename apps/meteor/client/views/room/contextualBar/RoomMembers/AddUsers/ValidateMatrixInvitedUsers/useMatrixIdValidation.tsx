import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import ValidateMatrixIdModal from './ValidateMatrixIdModal';

export type useMatrixIdValidationProps = {
	rid: IRoom['_id'];
	matrixIdVerifiedStatus: Map<string, string>;
	saveAction: () => void;
	onClickBack: () => void;
	reload: () => void;
	users: string[];
};

export const useMatrixIdValidation = ({
	matrixIdVerifiedStatus,
	rid,
	onClickBack,
	reload,
	users,
}: useMatrixIdValidationProps): (() => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const saveAction = useMethod('addUsersToRoom');
	const dispatchToastMessage = useToastMessageDispatch();
	const handleClose = useMutableCallback(() => setModal(null));

	const handleSave = useMutableCallback(async () => {
		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			handleClose();
			onClickBack();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
			handleClose();
		}
	});

	return useMemo(
		() => (): void =>
			setModal(<ValidateMatrixIdModal onClose={handleClose} onConfirm={handleSave} _matrixIdVerifiedStatus={matrixIdVerifiedStatus} />),
		[handleClose, handleSave, matrixIdVerifiedStatus, setModal],
	);
};
