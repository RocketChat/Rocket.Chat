import type { App } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import type { AppPermissionsReviewModalProps } from '../AppPermissionsReviewModal';
import AppPermissionsReviewModal from '../AppPermissionsReviewModal';

export const useOpenAppPermissionsReviewModal: (params: {
	app: App;
	onCancel: AppPermissionsReviewModalProps['onCancel'];
	onConfirm: AppPermissionsReviewModalProps['onConfirm'];
}) => () => void = ({ app, onCancel, onConfirm }) => {
	const setModal = useSetModal();

	return useCallback(() => {
		const handleCancel = () => {
			setModal(null);
			onCancel();
		};

		const handleConfirm: typeof onConfirm = (appPermissions) => {
			setModal(null);
			onConfirm(appPermissions);
		};

		return setModal(<AppPermissionsReviewModal appPermissions={app.permissions} onCancel={handleCancel} onConfirm={handleConfirm} />);
	}, [app.permissions, onCancel, onConfirm, setModal]);
};
