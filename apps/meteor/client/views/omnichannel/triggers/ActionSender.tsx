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
	const senderFieldId = useUniqueId();
	const { t } = useTranslation();
	const sender = useWatch({ control, name: `actions.${index}.params.sender` });

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
					name={`actions.${index}.params.sender`}
					control={control}
					render={({ field }) => {
						return <Select id={senderFieldId} {...field} options={senderOptions} placeholder={t('Select_an_option')} />;
					}}
				/>
			</FieldRow>

			{sender === 'custom' && (
				<FieldRow>
					<Controller
						name={`actions.${index}.params.name`}
						control={control}
						render={({ field }) => {
							return <TextInput {...field} placeholder={t('Name_of_agent')} />;
						}}
					/>
				</FieldRow>
			)}
		</Field>
	);
};
