import type { ILivechatDepartmentAgents, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useId } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../../../AutoCompleteDepartmentAgent';
import { cxp } from '../../../utils/cx';
import type { RepliesFormData } from '../RepliesForm';

type AgentFieldProps = ComponentProps<typeof Field> & {
	control: Control<RepliesFormData>;
	agents: Serialized<ILivechatDepartmentAgents>[];
	canAssignAgent?: boolean;
	disabled?: boolean;
	isLoading?: boolean;
};

const AgentField = ({ control, agents, canAssignAgent, disabled = false, isLoading = false, ...props }: AgentFieldProps) => {
	const { t } = useTranslation();
	const agentFieldId = useId();

	const {
		field: agentField,
		fieldState: { error: agentFieldError },
	} = useController({
		control,
		name: 'agentId',
	});

	return (
		<Field {...props}>
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
					agents={agents}
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
