import { NumberInput, TableCell, TableRow } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';
import type { UseFormRegister } from 'react-hook-form';

import type { FormValues, IDepartmentAgent } from '../EditDepartment';
import AgentAvatar from './AgentAvatar';
import RemoveAgentButton from './RemoveAgentButton';

type AgentRowProps = {
	agent: IDepartmentAgent;
	index: number;
	register: UseFormRegister<FormValues>;
	onRemove: (agentId: string) => void;
};

const AgentRow = ({ index, agent, register, onRemove }: AgentRowProps) => {
	const t = useTranslation();

	return (
		<TableRow key={agent.agentId} tabIndex={0} role='link' action qa-user-id={agent.agentId}>
			<TableCell withTruncatedText>
				<AgentAvatar name={agent.name || ''} username={agent.username || ''} />
			</TableCell>
			<TableCell fontScale='p2' color='hint' withTruncatedText>
				<NumberInput title={t('Count')} maxWidth='100%' {...register(`agentList.${index}.count`, { valueAsNumber: true })} />
			</TableCell>
			<TableCell fontScale='p2' color='hint' withTruncatedText>
				<NumberInput title={t('Order')} maxWidth='100%' {...register(`agentList.${index}.order`, { valueAsNumber: true })} />
			</TableCell>
			<TableCell fontScale='p2' color='hint'>
				<RemoveAgentButton agentId={agent.agentId} onRemove={onRemove} />
			</TableCell>
		</TableRow>
	);
};
export default memo(AgentRow);
