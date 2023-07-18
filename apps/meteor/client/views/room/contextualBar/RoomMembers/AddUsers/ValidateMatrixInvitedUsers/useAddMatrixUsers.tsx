import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useMethod, useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React from 'react';

import ValidateMatrixIdModal from './ValidateMatrixIdModal';

export type useAddMatrixUsersProps = {
	rid: IRoom['_id'];
	reload: () => void;
	onClickBack: () => void;
	handleUsers: (value: string | string[]) => void;
	users: string[];
};

export const useAddMatrixUsers = ({ rid, reload, onClickBack, handleUsers, users }: useAddMatrixUsersProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const saveAction = useMethod('addUsersToRoom');
	const dispatchToastMessage = useToastMessageDispatch();
	const handleClose = useMutableCallback(() => setModal(null));
	const dispatchVerifyEndpoint = useEndpoint('GET', '/v1/federation/matrixId.verify', undefined);

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

	const handleMatrixValidation = useMutableCallback(async () => {
		try {
			const matrixIdVerificationMap = new Map();
			const matrixIds = users.filter((user) => user.startsWith('@'));

			const matrixIdsVerificationPromises = matrixIds.map((matrixId) => dispatchVerifyEndpoint({ matrixId }));

			const matrixIdsVerificationPromiseResponse = await Promise.allSettled(matrixIdsVerificationPromises);
			const matrixIdsVerificationFulfilledResults = matrixIdsVerificationPromiseResponse.filter(
				(res) => res.status === 'fulfilled',
			) as PromiseFulfilledResult<{ result: string }>[];

			matrixIds.forEach((matrixId, idx) => {
				const {
					value: { result },
				} = matrixIdsVerificationFulfilledResults[idx];

				matrixIdVerificationMap.set(matrixId, result);
			});

			handleUsers(users.filter((user) => !(matrixIdVerificationMap.has(user) && matrixIdVerificationMap.get(user) === 'UNVERIFIED')));

			setModal(<ValidateMatrixIdModal onClose={handleClose} onConfirm={handleSave} matrixIdVerifiedStatus={matrixIdVerificationMap} />);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	return handleMatrixValidation;
};
