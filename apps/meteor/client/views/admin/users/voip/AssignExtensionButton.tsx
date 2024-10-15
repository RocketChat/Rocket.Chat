import { Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AssignExtensionModal from './AssignExtensionModal';

const AssignExtensionButton = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleAssign = useEffectEvent(() => {
		setModal(<AssignExtensionModal onClose={(): void => setModal(null)} />);
	});

	return (
		<Button icon='phone' onClick={handleAssign}>
			{t('Assign_extension')}
		</Button>
	);
};

export default AssignExtensionButton;
