import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo } from 'react';

import ValidateMatrixIdModal from './ValidateMatrixIdModal';

export type useAddMatrixUsersProps = {
	users: string[];
};

export const useAddMatrixUsers = ({ users }: useAddMatrixUsersProps): (() => void) => {
	const setModal = useSetModal();
	const handleClose = useMutableCallback(() => setModal(null));

	return useMemo(
		() => (): void =>
			setModal(<ValidateMatrixIdModal onClose={handleClose} onConfirm={handleSave} _matrixIdVerifiedStatus={matrixIdVerifiedStatus} />),
		[handleClose, handleSave, matrixIdVerifiedStatus, setModal],
	);
};
