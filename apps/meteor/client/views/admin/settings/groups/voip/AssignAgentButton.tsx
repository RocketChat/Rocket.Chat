import { Table, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import AssignAgentModal from './AssignAgentModal';

const AssignAgentButton: FC<{ extension: string; reload: () => void }> = ({ extension, reload }) => {
	const t = useTranslation();
	const setModal = useSetModal();

	const handleAssociation = useMutableCallback((e) => {
		e.stopPropagation();
		setModal(<AssignAgentModal existingExtension={extension} closeModal={(): void => setModal()} reload={reload} />);
	});

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='user-plus' small title={t('Associate_Agent')} onClick={handleAssociation} />
		</Table.Cell>
	);
};

export default AssignAgentButton;
