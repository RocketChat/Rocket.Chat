import { useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useRequire2faSetup } from '../views/hooks/useRequire2faSetup';
import TwoFactorRequiredModal from '../views/root/MainLayout/TwoFactorRequiredModal';

export const useTwoFactorAuthSetupCheck = () => {
	const setModal = useSetModal();
	const require2faSetup = useRequire2faSetup();

	useEffect(() => {
		if (require2faSetup) {
			setModal(<TwoFactorRequiredModal />);
		}
	}, [setModal, require2faSetup]);
};
