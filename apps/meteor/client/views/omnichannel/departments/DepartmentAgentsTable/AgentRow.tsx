import { NumberInput } from '@rocket.chat/fuselage';
import { memo } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import type { EditDepartmentFormData, IDepartmentAgent } from '../definitions';
import AgentAvatar from './AgentAvatar';
import RemoveAgentButton from './RemoveAgentButton';

type AgentRowProps = {
	agent: IDepartmentAgent;
	index: number;
	register: UseFormRegister<EditDepartmentFormData>;
	onRemove: (agentId: string) => void;
};

const AgentRow = ({ index, agent, register, onRemove }: AgentRowProps) => {
	const { t } = useTranslation();

	return (
		<GenericTableRow key={agent.agentId} tabIndex={0} role='link' action qa-user-id={agent.agentId}>
			<GenericTableCell withTruncatedText>
				<AgentAvatar name={agent.name || ''} username={agent.username || ''} />
			</GenericTableCell>
			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				<NumberInput title={t('Count')} maxWidth='100%' {...register(`agentList.${index}.count`, { valueAsNumber: true })} />
			</GenericTableCell>
			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				<NumberInput title={t('Order')} maxWidth='100%' {...register(`agentList.${index}.order`, { valueAsNumber: true })} />
			</GenericTableCell>
			<GenericTableCell fontScale='p2' color='hint'>
				<RemoveAgentButton agentId={agent.agentId} onRemove={onRemove} />
			</GenericTableCell>
		</GenericTableRow>
	);
};
export default memo(AgentRow);
