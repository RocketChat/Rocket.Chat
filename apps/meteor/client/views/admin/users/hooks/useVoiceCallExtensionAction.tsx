import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Action } from '../../../hooks/useActionSpread';
import AssignExtensionModal from '../voip/AssignExtensionModal';
import RemoveExtensionModal from '../voip/RemoveExtensionModal';

type VoiceCallExtensionActionParams = {
	name: string;
	username: string;
	extension?: string;
};

export const useVoiceCallExtensionAction = ({ name, username, extension }: VoiceCallExtensionActionParams): Action | undefined => {
	const isVoiceCallEnabled = useSetting('VoIP_TeamCollab_Enabled');
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleExtensionAssignment = useEffectEvent(() => {
		if (extension) {
			setModal(<RemoveExtensionModal name={name} username={username} extension={extension} onClose={(): void => setModal(null)} />);
			return;
		}

		setModal(<AssignExtensionModal defaultUsername={username} onClose={(): void => setModal(null)} />);
	});

	return isVoiceCallEnabled
		? {
				icon: extension ? 'phone-disabled' : 'phone',
				label: extension ? t('Unassign_extension') : t('Assign_extension'),
				action: handleExtensionAssignment,
		  }
		: undefined;
};
