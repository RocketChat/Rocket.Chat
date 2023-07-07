import type { IUser } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useUserId } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import type { Action } from '../../../../hooks/useActionSpread';
import ReportUserModal from './reportUserModal';

export const useReportUser = (user: Pick<IUser, '_id' | 'username'>): Action | undefined => {
	const { _id: uid, username } = user;
	const ownUserId = useUserId();
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal(null));

	const reportUser = useMemo(() => {
		const action = () => {
			const onConfirm = () => console.log('Report User -> ', uid);

			return setModal(<ReportUserModal uid={uid} username={username} onConfirm={onConfirm} onCancel={closeModal} />);
		};

		return ownUserId !== uid
			? {
					label: (
						<Box color='status-font-on-danger'>
							<Icon mie='x4' name='warning' size='x20' />
							Report User
						</Box>
					),
					action,
			  }
			: undefined;
	}, [ownUserId, uid, username, closeModal, setModal]);

	return reportUser;
};
