import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import AddMatrixUsersModal from './AddMatrixUsersModal';

export type useAddMatrixUsersProps = {
	handleSave: (args_0: any) => Promise<void>;
	users: string[];
};

export const useAddMatrixUsers = () => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleClose = useMutableCallback(() => setModal(null));
	const dispatchVerifyEndpoint = useEndpoint('GET', '/v1/federation/matrixIds.verify');

	return useMutation(async ({ users, handleSave }: useAddMatrixUsersProps) => {
		try {
			let matrixIdVerificationMap = new Map();
			const matrixIds = users.filter((user) => user.startsWith('@'));
			const matrixIdsVerificationResponse = await dispatchVerifyEndpoint({ matrixIds });
			const { results: matrixIdsVerificationResults } = matrixIdsVerificationResponse;
			matrixIdVerificationMap = new Map(Object.entries(matrixIdsVerificationResults));

			setModal(
				<AddMatrixUsersModal
					completeUserList={users}
					onClose={handleClose}
					onSave={handleSave}
					matrixIdVerifiedStatus={matrixIdVerificationMap as Map<string, string>}
				/>,
			);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});
};
