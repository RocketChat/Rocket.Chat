import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { GenericTableCell } from '../../../../components/GenericTable';
import AssignExtensionModal from './AssignExtensionModal';

const AssignExtensionButton: FC<{ username: string }> = ({ username }) => {
	const t = useTranslation();
	const setModal = useSetModal();

	const handleAssociation = useMutableCallback((e) => {
		e.stopPropagation();
		setModal(<AssignExtensionModal existingUser={username} closeModal={(): void => setModal()} />);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='user-plus' small title={t('Associate_Extension')} onClick={handleAssociation} />
		</GenericTableCell>
	);
};

export default AssignExtensionButton;
