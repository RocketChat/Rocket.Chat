import type { ILivechatDepartmentAgents, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../../../AutoCompleteDepartmentAgent';
import { cxp } from '../../../utils/cx';
import type { RepliesFormData } from '../RepliesForm';

type AgentFieldProps = {
	control: Control<RepliesFormData>;
	agents: Serialized<ILivechatDepartmentAgents>[];
	canAssignAny?: boolean;
	canAssignSelfOnly?: boolean;
	disabled?: boolean;
	isLoading?: boolean;
};

const AgentField = ({ control, agents, canAssignAny, canAssignSelfOnly, disabled = false, isLoading = false }: AgentFieldProps) => {
	const { t } = useTranslation();
	const agentFieldId = useId();

	const userId = useUserId();
	const canAssignAgent = canAssignSelfOnly || canAssignAny;

	const allowedAgents = canAssignAny ? agents : agents.filter((agent) => agent.agentId === userId);

	const {
		field: agentField,
		fieldState: { error: agentFieldError },
	} = useController({
		control,
		name: 'agentId',
	});

	return (
		<Field>
			<FieldLabel htmlFor={agentFieldId}>{`${t('Agent')} (${t('optional')})`}</FieldLabel>
			<FieldRow>
				<AutoCompleteAgent
					name={agentField.name}
					aria-busy={isLoading}
					aria-invalid={!!agentFieldError}
					aria-describedby={cxp(agentFieldId, {
						error: !!agentFieldError,
						hint: true,
					})}
					error={!!agentFieldError}
					id={agentFieldId}
					agents={allowedAgents}
					placeholder={isLoading ? t('Loading...') : t('Select_agent')}
					disabled={disabled || isLoading || !canAssignAgent}
					value={agentField.value}
					onChange={agentField.onChange}
				/>
			</FieldRow>
			{agentFieldError && (
				<FieldError aria-live='assertive' id={`${agentFieldId}-error`} display='flex' alignItems='center'>
					{agentFieldError.message}
				</FieldError>
			)}
			<FieldHint id={`${agentFieldId}-hint`}>
				{canAssignAgent ? t('Outbound_message_agent_hint') : t('Outbound_message_agent_hint_no_permission')}
			</FieldHint>
		</Field>
	);
};

export default AgentField;
