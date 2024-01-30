import { Box, Field, FieldGroup, FieldHint, FieldLabel, FieldRow, Option, SelectLegacy, Tag } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { Control, UseFormTrigger } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../../ee/client/hooks/useHasLicenseModule';
import { type TriggersPayload } from '../EditTrigger';
import { useActionFormFields } from '../hooks/useActionFormFields';

type SendMessageFormType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
	trigger: UseFormTrigger<TriggersPayload>;
};

const ACTION_HINTS: Record<string, TranslationKey> = {
	'use-external-service': 'External_service_action_hint',
} as const;

export const ActionForm = ({ control, index, trigger, ...props }: SendMessageFormType) => {
	const t = useTranslation();

	const actionFieldId = useUniqueId();
	const actionFieldName = `actions.${index}.name` as const;
	const actionFieldValue = useWatch({ control, name: actionFieldName });

	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const actionOptions: any[] = useMemo(() => {
		return [
			['send-message', t('Send_a_message')],
			['use-external-service', t('Send_a_message_external_service')],
		];
	}, [t]);

	const ActionFormFields = useActionFormFields(actionFieldValue);
	const actionHint = useMemo(() => ACTION_HINTS[actionFieldValue] || '', [actionFieldValue]);

	// TODO: Remove legacySelect once we have a new Select component

	const renderOption = useCallback(
		(label: TranslationKey, value: string) => {
			return (
				<>
					{!hasLicense && value === 'use-external-service' ? (
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
		[hasLicense, t],
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
								<SelectLegacy
									ref={ref}
									name={name}
									onChange={onChange}
									value={value}
									options={actionOptions}
									renderSelected={({ label, value }) => <Box flexGrow='1'>{renderOption(label, value)}</Box>}
									renderItem={({ label, value, ...props }) => (
										<Option
											{...props}
											// TODO: Remove this once we have a new Select component
											onMouseDown={!hasLicense && value === 'use-external-service' ? (e) => e.preventDefault : props?.onMouseDown}
											disabled={!hasLicense && value === 'use-external-service'}
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
