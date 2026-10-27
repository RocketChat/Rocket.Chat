import { NumberInput } from '@rocket.chat/fuselage';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import { memo } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { EditDepartmentFormData, IDepartmentAgent } from '../definitions';
import AgentAvatar from './AgentAvatar';
import RemoveAgentButton from './RemoveAgentButton';

export type AgentRowProps = {
	agent: IDepartmentAgent;
	index: number;
	register: UseFormRegister<EditDepartmentFormData>;
	onRemove: (agentId: string) => void;
};

const AgentRow = ({ index, agent, register, onRemove }: AgentRowProps) => {
	const { t } = useTranslation();

	return (
		<GenericTableRow key={agent.agentId} tabIndex={0} action>
			<GenericTableCell truncate>
				<AgentAvatar name={agent.name || ''} username={agent.username || ''} />
			</GenericTableCell>
			<GenericTableCell color='hint' truncate>
				<NumberInput title={t('Count')} {...register(`agentList.${index}.count`, { valueAsNumber: true })} />
			</GenericTableCell>
			<GenericTableCell color='hint' truncate>
				<NumberInput title={t('Order')} {...register(`agentList.${index}.order`, { valueAsNumber: true })} />
			</GenericTableCell>
			<GenericTableCell color='hint'>
				<RemoveAgentButton agentId={agent.agentId} onRemove={onRemove} />
			</GenericTableCell>
		</GenericTableRow>
	);
};
export default memo(AgentRow);
