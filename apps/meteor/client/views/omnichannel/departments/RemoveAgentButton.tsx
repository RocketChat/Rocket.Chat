import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, Key, SetStateAction } from 'react';
import React from 'react';

import GenericModal from '../../../components/GenericModal';

type Props = {
	agentId: Key;
	setAgentList: Dispatch<SetStateAction<ILivechatDepartmentAgents[]>>;
	agentList: ILivechatDepartmentAgents[];
	setAgentsRemoved: Dispatch<SetStateAction<{ agentId: Key }[]>>;
};

function RemoveAgentButton({ agentId, setAgentList, agentList, setAgentsRemoved }: Props) {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			const newList = agentList.filter((listItem) => listItem.agentId !== agentId);
			setAgentList(newList);
			dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			setModal();
			setAgentsRemoved((agents) => [...agents, { agentId }]);
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return <IconButton icon='trash' mini title={t('Remove')} onClick={handleDelete} />;
}

export default RemoveAgentButton;
