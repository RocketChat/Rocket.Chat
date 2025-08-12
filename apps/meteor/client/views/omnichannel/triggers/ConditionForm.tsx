import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, NumberInput, Select, TextInput } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useId, useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TriggersPayload } from './EditTrigger';

type ConditionFormType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
};

export const ConditionForm = ({ control, index, ...props }: ConditionFormType) => {
	const conditionFieldId = useId();
	const { t } = useTranslation();
	const conditionName = useWatch({ control, name: `conditions.${index}.name` });

	const placeholders: { [conditionName: string]: string } = useMemo(
		() => ({
			'page-url': t('Enter_a_regex'),
			'time-on-site': t('Time_in_seconds'),
		}),
		[t],
	);

	const conditionOptions: SelectOption[] = useMemo(
		() => [
			['page-url', t('Visitor_page_URL')],
			['time-on-site', t('Visitor_time_on_site')],
			['chat-opened-by-visitor', t('Chat_opened_by_visitor')],
			['after-guest-registration', t('After_guest_registration')],
		],
		[t],
	);

	const conditionValuePlaceholder = placeholders[conditionName];

	return (
		<FieldGroup {...props}>
			<Field>
				<FieldLabel htmlFor={conditionFieldId}>{t('Condition')}</FieldLabel>
				<FieldRow>
					<Controller
						name={`conditions.${index}.name`}
						control={control}
						render={({ field }) => (
							<Select {...field} id={conditionFieldId} options={conditionOptions} placeholder={t('Select_an_option')} />
						)}
					/>
				</FieldRow>

				{conditionValuePlaceholder && (
					<FieldRow>
						<Controller
							name={`conditions.${index}.value`}
							control={control}
							render={({ field }) => {
								if (conditionName === 'time-on-site') {
									return <NumberInput {...field} placeholder={conditionValuePlaceholder} />;
								}

								return <TextInput {...field} placeholder={conditionValuePlaceholder} />;
							}}
						/>
					</FieldRow>
				)}
			</Field>
		</FieldGroup>
	);
};
