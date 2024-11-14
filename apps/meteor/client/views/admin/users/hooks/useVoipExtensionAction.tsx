import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Action } from '../../../hooks/useActionSpread';
import AssignExtensionModal from '../voip/AssignExtensionModal';
import RemoveExtensionModal from '../voip/RemoveExtensionModal';
import { useVoipExtensionPermission } from '../voip/hooks/useVoipExtensionPermission';

type VoipExtensionActionParams = {
	name: string;
	username: string;
	extension?: string;
};

export const useVoipExtensionAction = ({ name, username, extension }: VoipExtensionActionParams): Action | undefined => {
	const canManageVoipExtensions = useVoipExtensionPermission();
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleExtensionAssignment = useEffectEvent(() => {
		if (extension) {
			setModal(<RemoveExtensionModal name={name} username={username} extension={extension} onClose={(): void => setModal(null)} />);
			return;
		}

		setModal(<AssignExtensionModal defaultUsername={username} onClose={(): void => setModal(null)} />);
	});

	return canManageVoipExtensions
		? {
				icon: extension ? 'phone-disabled' : 'phone',
				label: extension ? t('Unassign_extension') : t('Assign_extension'),
				action: handleExtensionAssignment,
			}
		: undefined;
};
