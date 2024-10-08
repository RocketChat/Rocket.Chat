import { IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableCell } from '../../../../components/GenericTable';
import AssignExtensionModal from './AssignExtensionModal';

const AssignExtensionButton = ({ username }: { username: string }) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleAssociation = useEffectEvent((e) => {
		e.stopPropagation();
		setModal(<AssignExtensionModal defaultUsername={username} onClose={(): void => setModal(null)} />);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='user-plus' small title={t('Associate_Extension')} onClick={handleAssociation} />
		</GenericTableCell>
	);
};

export default AssignExtensionButton;
