import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { FederationVerifyMatrixIdProps } from '@rocket.chat/rest-typings';
import { useToastMessageDispatch, useMethod, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useForm } from '../../../../../hooks/useForm';
import { useRoom } from '../../../contexts/RoomContext';
import { useTabBarClose } from '../../../contexts/ToolboxContext';
import AddUsers from './AddUsers';
import type { useMatrixIdValidationProps } from './ValidateMatrixInvitedUsers/useMatrixIdValidation';
import { useMatrixIdValidation } from './ValidateMatrixInvitedUsers/useMatrixIdValidation';

type AddUsersWithDataProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
	reload: () => void;
};

type AddUsersInitialProps = {
	users: Exclude<IUser['username'], undefined>[];
};

const AddUsersWithData = ({ rid, onClickBack, reload }: AddUsersWithDataProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const room = useRoom();

	const onClickClose = useTabBarClose();
	const saveAction = useMethod('addUsersToRoom');

	const { values, handlers } = useForm({ users: [] as IUser['username'][] });
	const { users } = values as AddUsersInitialProps;
	const { handleUsers } = handlers;

	const matrixIdVerificationMap = new Map();
	const dispatchValidationForMatrixId = useMatrixIdValidation({
		matrixIdVerifiedStatus: matrixIdVerificationMap,
		onClickBack,
		rid,
		reload,
		users,
	} as useMatrixIdValidationProps);
	const dispatchVerifyEndpoint = useEndpoint('GET', '/v1/federation/verifyMatrixId', undefined);

	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
	});

	const handleSave = useMutableCallback(async () => {
		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			onClickBack();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	const handleMatrixValidation = useMutableCallback(async () => {
		try {
			const matrixIds = users.filter((user) => user.startsWith('@'));

			const matrixIdsVerificationPromises = matrixIds.map((matrixId) =>
				dispatchVerifyEndpoint({ matrixId } as FederationVerifyMatrixIdProps),
			);

			const matrixIdsVerificationPromiseResponse = await Promise.allSettled(matrixIdsVerificationPromises);
			const matrixIdsVerificationFulfilledResults = matrixIdsVerificationPromiseResponse.filter(
				(res) => res.status === 'fulfilled',
			) as PromiseFulfilledResult<{ result: string }>[];

			for (let i = 0; i < matrixIds.length; i++) {
				const {
					value: { result },
				} = matrixIdsVerificationFulfilledResults[i];

				matrixIdVerificationMap.set(matrixIds[i], result);
			}

			handleUsers(users.filter((user) => !(matrixIdVerificationMap.has(user) && matrixIdVerificationMap.get(user) === 'UNVERIFIED')));

			dispatchValidationForMatrixId();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	const onChangeUsersFn = isRoomFederated(room) ? handleUsers : onChangeUsers;
	const onClickSaveFn = isRoomFederated(room) ? handleMatrixValidation : handleSave;

	return (
		<AddUsers
			onClickClose={onClickClose}
			onClickBack={onClickBack}
			onClickSave={onClickSaveFn}
			users={users}
			isRoomFederated={isRoomFederated(room)}
			onChange={onChangeUsersFn}
		/>
	);
};

export default AddUsersWithData;
