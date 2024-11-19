import type { App, AppPermission } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import AppPermissionsReviewModal from '../AppPermissionsReviewModal';

export const useOpenAppPermissionsReviewModal: (params: {
	app: App;
	onCancel: () => void;
	onConfirm: (permissionsGranted: AppPermission[]) => void;
}) => () => void = ({ app, onCancel, onConfirm }) => {
	const setModal = useSetModal();

	return useCallback(() => {
		const handleCancel = () => {
			setModal(null);
			onCancel();
		};

		const handleConfirm = (appPermissions: AppPermission[]) => {
			setModal(null);
			onConfirm(appPermissions);
		};

		return setModal(<AppPermissionsReviewModal appPermissions={app.permissions} onCancel={handleCancel} onConfirm={handleConfirm} />);
	}, [app.permissions, onCancel, onConfirm, setModal]);
};
