import {
	Box,
	Field,
	FieldGroup,
	FieldHint,
	FieldLabel,
	FieldRow,
	Option,
	SelectLegacy,
	Tag,
	type SelectOption,
} from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useCallback, useId, useMemo } from 'react';
import type { Control, UseFormTrigger } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { type TriggersPayload } from '../EditTrigger';
import { getActionFormFields } from '../utils';

type SendMessageFormType = ComponentProps<typeof Field> & {
	control: Control<TriggersPayload>;
	trigger: UseFormTrigger<TriggersPayload>;
	index: number;
};

const ACTION_HINTS: Record<string, TranslationKey> = {
	'use-external-service': 'External_service_action_hint',
} as const;

const PREMIUM_ACTIONS = ['use-external-service'];

export const ActionForm = ({ control, trigger, index, ...props }: SendMessageFormType) => {
	const { t } = useTranslation();

	const actionFieldId = useId();
	const actionFieldName = `actions.${index}.name` as const;
	const actionFieldValue = useWatch({ control, name: actionFieldName });

	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const actionOptions = useMemo<SelectOption[]>(() => {
		return [
			['send-message', t('Send_a_message')],
			['use-external-service', t('Send_a_message_external_service')],
		];
	}, [t]);

	const ActionFormFields = getActionFormFields(actionFieldValue);
	const actionHint = useMemo(() => ACTION_HINTS[actionFieldValue] || '', [actionFieldValue]);
	const isOptionDisabled = useCallback((value: string) => !hasLicense && PREMIUM_ACTIONS.includes(value), [hasLicense]);

	const renderOption = useCallback(
		(label: TranslationKey, value: string) => {
			return (
				<>
					{isOptionDisabled(value) ? (
						<Box justifyContent='space-between' flexDirection='row' display='flex' width='100%'>
							{t(label)}
							<Tag variant='featured'>{t('Premium')}</Tag>
						</Box>
					) : (
						t(label)
					)}
				</>
			);
		},
		[isOptionDisabled, t],
	);

	return (
		<FieldGroup {...props}>
			<Field>
				<FieldLabel htmlFor={actionFieldId}>{t('Action')}</FieldLabel>
				<FieldRow>
					<Controller
						name={actionFieldName}
						control={control}
						render={({ field: { onChange, value, name, ref } }) => {
							return (
								// TODO: Remove SelectLegacy once we have a new Select component
								<SelectLegacy
									ref={ref}
									name={name}
									onChange={onChange}
									value={value}
									id={actionFieldId}
									options={actionOptions}
									renderSelected={({ label, value }) => <Box flexGrow='1'>{renderOption(label, value)}</Box>}
									renderItem={({ label, value, onMouseDown, ...props }) => (
										<Option
											{...props}
											onMouseDown={isOptionDisabled(value) ? (e) => e.preventDefault() : onMouseDown}
											disabled={isOptionDisabled(value)}
											label={renderOption(label, value)}
										/>
									)}
								/>
							);
						}}
					/>
				</FieldRow>
				{actionHint && <FieldHint>{t(actionHint)}</FieldHint>}
			</Field>

			<ActionFormFields control={control} trigger={trigger} index={index} />
		</FieldGroup>
	);
};
