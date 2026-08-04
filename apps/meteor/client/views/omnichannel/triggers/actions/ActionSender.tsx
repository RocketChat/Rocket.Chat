import { FieldRow, Select, TextInput, type FieldProps, type SelectOption, Field, FieldLabel } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TriggersPayload } from '../EditTrigger';

export type ActionSenderProps = FieldProps & {
	control: Control<TriggersPayload>;
	index: number;
	disabled?: boolean;
};

export const ActionSender = ({ control, index, disabled, ...props }: ActionSenderProps) => {
	const { t } = useTranslation();

	const senderFieldId = useId();
	const senderFieldName = `actions.${index}.params.sender` as const;
	const senderNameFieldName = `actions.${index}.params.name` as const;
	const senderNameFieldValue = useWatch({ control, name: senderFieldName });

	const senderOptions: SelectOption[] = useMemo(
		() => [
			['queue', t('Impersonate_next_agent_from_queue')],
			['custom', t('Custom_agent')],
		],
		[t],
	);

	return (
		<Field {...props}>
			<FieldLabel htmlFor={senderFieldId}>{t('Sender')}</FieldLabel>
			<FieldRow>
				<Controller
					control={control}
					name={senderFieldName}
					defaultValue='queue'
					render={({ field }) => {
						return <Select {...field} id={senderFieldId} options={senderOptions} placeholder={t('Select_an_option')} disabled={disabled} />;
					}}
				/>
			</FieldRow>

			{senderNameFieldValue === 'custom' && (
				<FieldRow>
					<Controller
						control={control}
						name={senderNameFieldName}
						render={({ field }) => {
							return <TextInput {...field} placeholder={t('Name_of_agent')} aria-label={t('Name_of_agent')} disabled={disabled} />;
						}}
					/>
				</FieldRow>
			)}
		</Field>
	);
};
