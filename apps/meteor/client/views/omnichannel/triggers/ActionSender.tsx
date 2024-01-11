import { FieldRow, Select, TextInput, type SelectOption, Field, FieldLabel } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import React, { useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TriggersPayload } from './EditTrigger';

type ActionSenderType = ComponentProps<typeof Field> & {
	control: Control<TriggersPayload>;
	index: number;
};

export const ActionSender = ({ control, index, ...props }: ActionSenderType) => {
	const { t } = useTranslation();

	const senderFieldId = useUniqueId();
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
						return <Select id={senderFieldId} {...field} options={senderOptions} placeholder={t('Select_an_option')} />;
					}}
				/>
			</FieldRow>

			{senderNameFieldValue === 'custom' && (
				<FieldRow>
					<Controller
						control={control}
						name={senderNameFieldName}
						render={({ field }) => {
							return <TextInput {...field} placeholder={t('Name_of_agent')} />;
						}}
					/>
				</FieldRow>
			)}
		</Field>
	);
};
