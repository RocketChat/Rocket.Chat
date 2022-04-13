import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC } from 'react';

import { useSetModal } from '../../../../../contexts/ModalContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
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
			<Button small ghost title={t('Associate_Agent')} onClick={handleAssociation}>
				<Icon name='user-plus' size='x20' mie='x4' />
			</Button>
		</Table.Cell>
	);
};

export default AssignAgentButton;
