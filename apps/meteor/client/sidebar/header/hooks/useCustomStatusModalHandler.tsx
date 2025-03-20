import { useSetModal, useUser } from '@rocket.chat/ui-contexts';

import EditStatusModal from '../EditStatusModal';

export const useCustomStatusModalHandler = () => {
	const user = useUser();
	const setModal = useSetModal();

	return () => {
		const handleModalClose = () => setModal(null);
		setModal(<EditStatusModal userStatus={user?.status} userStatusText={user?.statusText} onClose={handleModalClose} />);
	};
};
