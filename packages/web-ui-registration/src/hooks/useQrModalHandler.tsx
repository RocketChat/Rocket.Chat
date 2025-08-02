import { useSetModal } from '@rocket.chat/ui-contexts';

import QrModal from '../QrModal';

export const useQrModalHandler = () => {
	const setModal = useSetModal();
	return () => {
		const handleModalClose = () => setModal(null);
		setModal(<QrModal onClose={handleModalClose} />);
	};
};
