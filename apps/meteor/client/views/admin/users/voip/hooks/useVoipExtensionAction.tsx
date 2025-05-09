import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { AdminUserAction } from '../../hooks/useAdminUserInfoActions';
import AssignExtensionModal from '../AssignExtensionModal';
import RemoveExtensionModal from '../RemoveExtensionModal';

type VoipExtensionActionParams = {
	name: string;
	username: string;
	extension?: string;
	enabled: boolean;
};

export const useVoipExtensionAction = ({ name, username, extension, enabled }: VoipExtensionActionParams): AdminUserAction | undefined => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleExtensionAssignment = useEffectEvent(() => {
		if (extension) {
			setModal(<RemoveExtensionModal name={name} username={username} extension={extension} onClose={(): void => setModal(null)} />);
			return;
		}

		setModal(<AssignExtensionModal defaultUsername={username} onClose={(): void => setModal(null)} />);
	});

	return enabled
		? {
				icon: extension ? 'phone-disabled' : 'phone',
				content: extension ? t('Unassign_extension') : t('Assign_extension'),
				onClick: handleExtensionAssignment,
			}
		: undefined;
};
